import { Component, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainComponent } from '../../main/main.component';

declare var jQuery: any;
declare var $: any;

// Importamos la clase Areas
class Areas {
  IdArea: number = 0;
  NombreArea: string = '';
  FechaCreacion: string = '';
  IdUsuarioCreador: number = 0;
  FechaRemocion: string = '';
  IdUsuarioRemovedor: number = 0;
  Activo: boolean = true;

  constructor(id: number, nom: string, creacion: string, crea: number, remocion: string, removedor: number, act: boolean) {
    this.IdArea = id;
    this.NombreArea = nom;
    this.FechaCreacion = creacion;
    this.IdUsuarioCreador = crea;
    this.FechaRemocion = remocion;
    this.IdUsuarioRemovedor = removedor;
    this.Activo = act;
  }
}

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent],
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.css']
})
export class AreasComponent implements OnInit {

  Areas: Areas[] = [];
  idArea: number = 0;
  Hoy = new Date();
  EditNombreArea = "";
  IndexUpdate: number = 0;
  IndexEliminar: number = 0;
  
  usuario:any={}
  all;

  //Cargando
  Loading:boolean;
  LoadingTabla:boolean;


  //Mensajes de error
  error;
  errorEdit;

  //Mensajes
  msg:string;

  //Url
  urlBase:string="http://trazas-nbi.com:1234/api/";
  controlador: string = "Area/";
  urlFull: string = this.urlBase + this.controlador;

  constructor(private route: Router, private http: HttpClient) {

    /*this.Areas=[
      {IdArea:1,NombreArea:"Construcción",FechaCreacion:"01/01/2018"},
      {IdArea:2,NombreArea:"Arquitectura",FechaCreacion:"02/01/2018"}
    ]*/

    this.Loading = false;
    this.LoadingTabla = true;

    this.GetAreas();

    try {
      this.usuario = JSON.parse(localStorage['usuario']);
    } catch (err: any) {
      console.log(err?.message);
    }

  }

  ngOnInit() {
    if (typeof $ !== 'undefined') {
      $("#txtArea").focus();
    }
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");
  }

  GetAreas() {
    this.http.get<any[]>(this.urlFull)
      .subscribe({
        next: (Area) => {
          this.Areas = Area;
          this.Loading = false;
          this.LoadingTabla = false;
        },
        error: (err) => {
          console.error('Error loading areas:', err);
          this.Loading = false;
          this.LoadingTabla = false;
        }
      });
  }

  Agregar(form: NgForm) {
    if (this.Validar(form)) {
      this.Loading = true;
      const Area: Areas = new Areas(
        0, 
        form.value.txtArea, 
        this.retFecha(this.Hoy), 
        this.usuario.idUsuario, 
        "", 
        0, 
        true
      );
      
      this.http.post<any>(this.urlFull, Area)
        .subscribe({
          next: (result) => {
            this.msg = "Se ha creado el elemento";
            this.Mensaje();
            Area.IdArea = result.idArea;
            this.GetAreas();
            form.reset();
            $("#txtArea").focus();
          },
          error: (xhr) => {
            this.GetAreas();
            form.reset();
          }
        });
    }
  }

  Editar(i: number) {
    console.log('Editar clicked for index:', i);
    console.log('Area to edit:', this.Areas[i]);
    
    if (this.Areas[i]) {
      this.EditNombreArea = this.Areas[i].NombreArea;
      this.IndexUpdate = i;
      this.errorEdit = ""; // Limpiar errores previos
      this.VerPopUp();
      
      // Usar setTimeout para asegurar que el modal esté visible antes de hacer focus
      setTimeout(() => {
        if (typeof $ !== 'undefined') {
          $("#txtAreaEdit").focus();
        }
      }, 100);
    } else {
      console.error('Area not found at index:', i);
    }
  }

  Actualizar(form: NgForm) {
    if (this.ValidarEdit()) {
      this.Loading = true;
      let pag = this.urlFull + this.Areas[this.IndexUpdate].IdArea;
      this.Areas[this.IndexUpdate].NombreArea = this.EditNombreArea;
      
      this.http.post<any>(pag, this.Areas[this.IndexUpdate])
        .subscribe({
          next: (result) => {
            this.msg = "Se ha actualizado el elemento";
            this.Mensaje();
            this.GetAreas();
            form.reset();
            this.OcultarPopUp();
            $("#txtArea").focus();
          },
          error: (xhr) => {
            this.GetAreas();
          }
        });
    }
  }

  Eliminar() {
    this.Loading = true;
    let area: Areas;
    let pag = this.urlFull + this.Areas[this.IndexEliminar].IdArea;
    area = this.Areas[this.IndexEliminar];
    area.IdUsuarioRemovedor = this.usuario.idUsuario;
    area.FechaRemocion = this.retFecha(this.Hoy);
    
    this.http.post<any>(pag, area)
      .subscribe({
        next: (result) => {
          this.OcultarConfirmacion();
          this.GetAreas();
          this.msg = "Se ha eliminado el elemento";
          this.Mensaje();
          $("#txtArea").focus();
        },
        error: (xhr) => {
          this.GetAreas();
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

    return dd+'/'+mm+'/'+yyyy;
  }

  VerPopUp() {
    console.log('VerPopUp called');
    if (typeof $ !== 'undefined') {
      // Usar Bootstrap modal API en lugar de manipulación manual
      $('#exampleModalLong').modal('show');
    } else {
      console.error('jQuery not available');
      // Fallback para mostrar el modal sin jQuery
      const modal = document.getElementById('exampleModalLong');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-modal', 'true');
        // Agregar backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'modal-backdrop';
        document.body.appendChild(backdrop);
        document.body.classList.add('modal-open');
      }
    }
  }

  OcultarPopUp() {
    if (typeof $ !== 'undefined') {
      // Usar Bootstrap modal API en lugar de manipulación manual
      $('#exampleModalLong').modal('hide');
    } else {
      // Fallback para ocultar el modal sin jQuery
      const modal = document.getElementById('exampleModalLong');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
        // Remover backdrop
        const backdrop = document.getElementById('modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open');
      }
    }
    // Limpiar errores
    this.errorEdit = "";
  }

  Confirmacion(i: number) {
    if (typeof $ !== 'undefined') {
      $('#Confirm').modal('show');
    } else {
      const modal = document.getElementById('Confirm');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-modal', 'true');
        // Agregar backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'confirm-backdrop';
        document.body.appendChild(backdrop);
        document.body.classList.add('modal-open');
      }
    }
    this.IndexEliminar = i;
  }

  OcultarConfirmacion() {
    if (typeof $ !== 'undefined') {
      $('#Confirm').modal('hide');
    } else {
      const modal = document.getElementById('Confirm');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
        // Remover backdrop
        const backdrop = document.getElementById('confirm-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open');
      }
    }
    return false;
  }

  Mensaje() {
    if (typeof $ !== 'undefined') {
      $('#Mensaje').modal('show');
    } else {
      const modal = document.getElementById('Mensaje');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-modal', 'true');
        // Agregar backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'mensaje-backdrop';
        document.body.appendChild(backdrop);
        document.body.classList.add('modal-open');
      }
    }
  }

  OcultarMensaje() {
    if (typeof $ !== 'undefined') {
      $('#Mensaje').modal('hide');
    } else {
      const modal = document.getElementById('Mensaje');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
        // Remover backdrop
        const backdrop = document.getElementById('mensaje-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open');
      }
    }
  }

  Validar(form: NgForm){
    if (form.value.txtArea=="" || form.value.txtArea ===null){
      $("#txtArea").attr("class","form-control error")
      this.error="Debe ingresar valor"
      return false
    }
    return true
  }

  ValidarEdit(){
    if (this.EditNombreArea=="" || this.EditNombreArea ===null){
      $("#txtAreaEdit").attr("class","form-control error")
      this.errorEdit="Debe ingresar valor"
      return false
    }
    return true
  }

  Clean(){
    $("#txtArea").attr("class","form-control")
    this.error=""
  }

  CleanEdit(){
    $("#txtAreaEdit").attr("class","form-control")
    this.errorEdit=""
  }

}
