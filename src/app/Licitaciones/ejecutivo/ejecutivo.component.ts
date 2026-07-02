import { Component, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainComponent } from '../../main/main.component';

declare var jQuery: any;
declare var $: any;

// Importamos las clases necesarias
class Ejecutivos {
  IdEjecutivos: number;
  NombreEjecutivo: string;
  Telefono: string;
  Celular: string;
  Correo: string;
  FechaCreacion: string;
  IdMandante: number;
  IdUsuarioRemovedor: number;
  IdUsuarioCreador: number;

  constructor(id: number, nom: string, creacion: string, tel: string, cel: string, correo: string, man: number, removedor: number, creador: number) {
    this.IdEjecutivos = id;
    this.NombreEjecutivo = nom;
    this.Telefono = tel;
    this.Celular = cel;
    this.Correo = correo;
    this.FechaCreacion = creacion;
    this.IdMandante = man;
    this.IdUsuarioRemovedor = removedor;
    this.IdUsuarioCreador = creador;
  }
}

interface Mandante {
  IdMandante: number;
  NombreMandante: string;
}

@Component({
  selector: 'app-ejecutivo',
  templateUrl: './ejecutivo.component.html',
  styleUrls: ['./ejecutivo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent]
})
export class EjecutivoComponent implements OnInit {
  orden: string = 'alfabeto'; // 'alfabeto' o 'id'
  get ejecutivosOrdenados(): Ejecutivos[] {
    let arr = this.Ejecutivos ? [...this.Ejecutivos] : [];
    if (this.orden === 'alfabeto') {
      arr.sort((a, b) => a.NombreEjecutivo.localeCompare(b.NombreEjecutivo, 'es', {sensitivity: 'base'}));
    } else {
      arr.sort((a, b) => a.IdEjecutivos - b.IdEjecutivos);
    }
    return arr;
  }

  Ejecutivos:Ejecutivos[];
  idEjecutivo:number;
  Hoy = new Date();
  Editor:boolean=false;
  IndexUpdate:number;
  SelectMandante:boolean;
  drdMandantes;
  Mandantes:Mandante[];
  IndexEliminar:number;
  
  //CamposEditar
  EditNombreEjecutivo="";
  EditTelefono="";
  EditCelular="";
  EditCorreo="";

  //Errores
  error=[];
  errorEdit=[];

  //Generales
  usuario:any={}

  //Cargando
  Loading:boolean;
  LoadingTabla:boolean;

  //Mensajes
  msg:string;

  //Url
  urlBase:string="/api/";
  controlador:string="Ejecutivos/";
  urlFull:string=this.urlBase+this.controlador;

  constructor(private route: Router, private http: HttpClient) {

    this.Loading = false;
    this.LoadingTabla = false;
    this.SelectMandante = false;
    this.usuario = JSON.parse(localStorage.usuario);
    
    // Inicializar arrays de errores
    this.error = ["", "", "", ""];
    this.errorEdit = ["", "", "", ""];

    this.http.get<any[]>(this.urlBase + 'Mandante/')
      .subscribe({
        next: (Mandante) => {
          // Ordenar alfabéticamente por NombreMandante
          this.Mandantes = Mandante.sort((a, b) => (a.NombreMandante || '').localeCompare(b.NombreMandante || '', 'es', {sensitivity: 'base'}));
        },
        error: (err) => {
          console.error('Error loading mandantes:', err);
        }
      });

   }

  ngOnInit() {
    this.drdMandantes=0;
    
    // Focus con DOM nativo y fallback jQuery
    setTimeout(() => {
      const mandantesSelect = document.getElementById('drdMandantes') as HTMLSelectElement;
      if (mandantesSelect) {
        mandantesSelect.focus();
      } else if (typeof $ !== 'undefined') {
        $("#drdMandantes").focus();
      }
    }, 100);
    
    if (typeof $ !== 'undefined') {
      $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
      $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");
    }
  }

  BuscaEjecutivos(){
    if (this.drdMandantes > 0 )
    {
      this.SelectMandante=true;
      // Focus con DOM nativo y fallback jQuery
      setTimeout(() => {
        const nombreInput = document.getElementById('txtNombreEjecutivo') as HTMLInputElement;
        if (nombreInput) {
          nombreInput.focus();
        } else if (typeof $ !== 'undefined') {
          $("#txtNombreEjecutivo").focus();
        }
      }, 100);
      this.BuscaEjecutivosPorMandante(this.drdMandantes);
    }
    else
    {
      this.SelectMandante=false;
      setTimeout(() => {
        const mandantesSelect = document.getElementById('drdMandantes') as HTMLSelectElement;
        if (mandantesSelect) {
          mandantesSelect.focus();
        } else if (typeof $ !== 'undefined') {
          $("#drdMandantes").focus();
        }
      }, 100);
    }
  }

  BuscaEjecutivosPorMandante(_Mandante: number) {
    this.LoadingTabla = true;
    
    // Focus con DOM nativo y fallback jQuery
    setTimeout(() => {
      const nombreInput = document.getElementById('txtNombreEjecutivo') as HTMLInputElement;
      if (nombreInput) {
        nombreInput.focus();
      } else if (typeof $ !== 'undefined') {
        $("#txtNombreEjecutivo").focus();
      }
    }, 100);
    
    this.http.get<any[]>(this.urlFull + 'GetEjecutivosByidMandante/idMandante=' + _Mandante)
      .subscribe({
        next: (Ejecutivo) => {
          this.Ejecutivos = Ejecutivo;
          this.Loading = false;
          this.LoadingTabla = false;
        },
        error: (err) => {
          console.error('Error loading ejecutivos:', err);
          this.Loading = false;
          this.LoadingTabla = false;
        }
      });
  }

  Agregar(form: NgForm) {
    if (this.Validar(form)) {
      this.Loading = true;
      const Ejecutivo: Ejecutivos = new Ejecutivos(
        this.idEjecutivo,
        form.value.txtNombreEjecutivo,
        this.retFecha(this.Hoy),
        form.value.txtTelefono,
        form.value.txtCelular,
        form.value.txtCorreo,
        this.drdMandantes,
        0,
        this.usuario.idUsuario
      );
      
      this.http.post<any>(this.urlFull, Ejecutivo)
        .subscribe({
          next: (result) => {
            this.msg = "Se ha creado el elemento";
            this.Mensaje();
            Ejecutivo.IdMandante = result.idArea;
            this.BuscaEjecutivosPorMandante(this.drdMandantes);
            form.reset();
            this.Loading = false;
            
            // Focus con DOM nativo y fallback jQuery
            setTimeout(() => {
              const nombreInput = document.getElementById('txtNombreEjecutivo') as HTMLInputElement;
              if (nombreInput) {
                nombreInput.focus();
              } else if (typeof $ !== 'undefined') {
                $("#txtNombreEjecutivo").focus();
              }
            }, 100);
          },
          error: (xhr) => {
            this.Loading = false;
            this.BuscaEjecutivosPorMandante(this.drdMandantes);
            form.reset();
          }
        });
    }
  }

  Editar(i:number){
    this.Editor=true;
    this.EditNombreEjecutivo=this.Ejecutivos[i].NombreEjecutivo;
    this.EditTelefono=this.Ejecutivos[i].Telefono;
    this.EditCelular=this.Ejecutivos[i].Celular;
    this.EditCorreo=this.Ejecutivos[i].Correo
    this.IndexUpdate=i;
    this.VerPopUp();
    $("#txtEditEjecutivoEdit").focus();
  }
  
  Actualizar(form: NgForm) {
    if (this.ValidarEdit()) {
      this.Loading = true;
      let pag = this.urlFull + this.Ejecutivos[this.IndexUpdate].IdEjecutivos;
      this.Ejecutivos[this.IndexUpdate].NombreEjecutivo = this.EditNombreEjecutivo;
      this.Ejecutivos[this.IndexUpdate].Telefono = this.EditTelefono;
      this.Ejecutivos[this.IndexUpdate].Celular = this.EditCelular;
      this.Ejecutivos[this.IndexUpdate].Correo = this.EditCorreo;
      
      this.http.post<any>(pag, this.Ejecutivos[this.IndexUpdate])
        .subscribe({
          next: (result) => {
            this.msg = "Se ha actualizado el elemento";
            this.Mensaje();
            this.BuscaEjecutivosPorMandante(this.drdMandantes);
            form.reset();
            $("#txtNombreEjecutivo").focus();
            this.OcultarPopUp();
          },
          error: (xhr) => {
            this.BuscaEjecutivosPorMandante(this.drdMandantes);
          }
        });
    }
  }

  Eliminar() {
    this.Loading = true;
    let ejecutivo: Ejecutivos = this.Ejecutivos[this.IndexEliminar];
    let pag = this.urlFull + this.Ejecutivos[this.IndexEliminar].IdEjecutivos;
    ejecutivo.IdUsuarioRemovedor = this.usuario.idUsuario;
    
    this.http.post<any>(pag, ejecutivo)
      .subscribe({
        next: (result) => {
          this.OcultarConfirmacion();
          this.BuscaEjecutivosPorMandante(this.drdMandantes);
          this.msg = "Se ha eliminado el elemento";
          this.Mensaje();
          $("#txtNombreEjecutivo").focus();
        },
        error: (xhr) => {
          this.BuscaEjecutivosPorMandante(this.drdMandantes);
        }
      });
  }

  retFecha(now){
    var dd = now.getDate();
    var mm = now.getMonth()+1; //January is 0!
    var yyyy = now.getFullYear();

    if(dd<10){
      dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    // Solo fecha, sin hora
    return dd + '/' + mm + '/' + yyyy;
  }

  VerPopUp(){
    this.Editor = true;
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  }

  OcultarPopUp(){
    this.Editor = false;
    // Restaurar scroll del body
    document.body.style.overflow = '';
    // Limpiar errores
    this.error = [""];
  }

  Confirmacion(i){
    $("#Confirm").attr('class', 'modal fade in');
    $("#Confirm").attr("style", "display: block;background-color:rgba(0, 0, 0, 0.5);overflow-y: scroll;");
    $("body").attr("style", "overflow-y: hidden;");
    this.IndexEliminar=i;
  }

  OcultarConfirmacion(){
    $("#Confirm").attr('class', 'modal fade');
    $("#Confirm").attr("style", "");
    $("body").attr("style", "");
    return false
  }

  Mensaje(){
    $("#Mensaje").attr('class', 'modal fade in');
    $("#Mensaje").attr("style", "display: block;background-color:rgba(0, 0, 0, 0.5);overflow-y: scroll;");
    $("body").attr("style", "overflow-y: hidden;");
  }

  OcultarMensaje(){
    $("#Mensaje").attr('class', 'modal fade');
    $("#Mensaje").attr("style", "");
    $("body").attr("style", "");
  }

  Validar(form: NgForm){
    var bool:boolean=true;
    
    // Helper function para cambiar clases
    const setErrorClass = (elementId: string) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.className = 'form-control error';
      } else if (typeof $ !== 'undefined') {
        $("#" + elementId).attr("class", "form-control error");
      }
    };

    // Limpiar errores previos
    this.error = ["", "", "", ""];
    
    if (form.value.txtNombreEjecutivo=="" || form.value.txtNombreEjecutivo ===null){
      setErrorClass("txtNombreEjecutivo");
      this.error[0]="Debe ingresar valor";
      bool= false;
    }
    if (form.value.txtTelefono=="" || form.value.txtTelefono ===null){
      setErrorClass("txtTelefono");
      this.error[1]="Debe ingresar valor";
      bool= false;
    }else{
      let telefonoRegex = /\d{9}/;
      if (!telefonoRegex.test(form.value.txtTelefono)) {
        setErrorClass("txtTelefono");
        this.error[1]="Este campo no cumple con el formato requerido";
        bool= false;
      }
    }
    if (form.value.txtCelular=="" || form.value.txtCelular ===null){
      setErrorClass("txtCelular");
      this.error[2]="Debe ingresar valor";
      bool= false;
    }
    if (form.value.txtCorreo=="" || form.value.txtCorreo ===null){
      setErrorClass("txtCorreo");
      this.error[3]="Debe ingresar valor";
      bool= false;
    }else{
      let emailRegex = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;
      if (!emailRegex.test(form.value.txtCorreo)) {
        setErrorClass("txtCorreo");
        this.error[3]="Este campo no cumple con el formato requerido";
        bool= false;
      }
    }
    return bool
  }

  ValidarEdit(){
    var bool:boolean=true;
    if (this.EditNombreEjecutivo=="" || this.EditNombreEjecutivo ===null){
      $("#txtEditEjecutivoEdit").attr("class","form-control error")
      this.error[0]="Debe ingresar valor"
      bool= false
    }
    if (this.EditTelefono=="" || this.EditTelefono ===null){
      $("#txtEditTelefono").attr("class","form-control error")
      this.error[1]="Debe ingresar valor"
      bool= false
    }else{
      let telefonoRegex = /\d{9}/;
      if (!telefonoRegex.test(this.EditTelefono)) {
        $("#txtEditTelefono").attr("class","form-control error");
        this.error[1]="Este campo no cumple con el formato requerido";
        bool= false;
      }
    }
    if (this.EditCelular=="" || this.EditCelular ===null){
      $("#txtEditCelular").attr("class","form-control error")
      this.error[2]="Debe ingresar valor"
      bool= false
    }
    if (this.EditCorreo=="" || this.EditCorreo ===null){
      $("#txtEditCorreo").attr("class","form-control error")
      this.error[3]="Debe ingresar valor"
      bool= false
    }else{
      let emailRegex = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;
      //Se muestra un texto a modo de ejemplo, luego va a ser un icono
      if (!emailRegex.test(this.EditCorreo)) {
        $("#txtEditCorreo").attr("class","form-control error")
        this.error[3]="Este campo no cumple con el formato requerido"
        bool= false
      }
    }
    return bool
  }

  Clean(){
    // Limpiar usando DOM nativo con fallback a jQuery
    const elementos = [
      { id: 'txtNombreEjecutivo', index: 0 },
      { id: 'txtTelefono', index: 1 },
      { id: 'txtCelular', index: 2 },
      { id: 'txtCorreo', index: 3 }
    ];

    elementos.forEach(elemento => {
      const input = document.getElementById(elemento.id);
      if (input) {
        input.className = 'form-control';
      } else if (typeof $ !== 'undefined') {
        $("#" + elemento.id).attr("class", "form-control");
      }
    });
    
    this.error = ["", "", "", ""];
  }

}
