import { Component, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainComponent } from '../../main/main.component';
import { environment } from '../../../environments/environment';

declare var jQuery: any;
declare var $: any;
declare var Swal: any;

// Clase Hitos
class Hitos {
  IdHitos: number = 0;
  IdHito: number = 0; // Alias para compatibilidad
  NombreHito: string = '';
  Obligatorio: boolean = false;
  Obligatoria: boolean = false; // Alias para compatibilidad  
  MostrarEnCalendario: boolean = false;
  Calendarizada: boolean = false; // Alias para compatibilidad
  NombreCalendario: string = '';
  ColorCalendario: string = '';
  FechaCreacion: string = '';
  FechaCompromiso: string = ''; // Agregada para compatibilidad
  IdUsuarioCreador: number = 0;
  FechaRemocion: string = '';
  IdUsuarioRemovedor: number = 0;
  Activo: boolean = true;

  constructor(id: number, nom: string, oblig: boolean, mostrarCal: boolean, nomCal: string, colorCal: string, creacion: string, crea: number, remocion: string, removedor: number, act: boolean, fechaCompromiso: string = '') {
    this.IdHitos = id;
    this.IdHito = id;
    this.NombreHito = nom;
    this.Obligatorio = oblig;
    this.Obligatoria = oblig;
    this.MostrarEnCalendario = mostrarCal;
    this.Calendarizada = mostrarCal;
    this.NombreCalendario = nomCal;
    this.ColorCalendario = colorCal;
    this.FechaCreacion = creacion;
    this.FechaCompromiso = fechaCompromiso;
    this.IdUsuarioCreador = crea;
    this.FechaRemocion = remocion;
    this.IdUsuarioRemovedor = removedor;
    this.Activo = act;
  }
}

@Component({
  selector: 'app-hitos',
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent],
  templateUrl: './hitos.component.html',
  styleUrls: ['./hitos.component.css']
})
export class HitosComponent implements OnInit {
  // Ordenamiento: 'numero' (por IdHito) o 'alfabeto' (por NombreHito)
  orden: string = 'numero';
  pageSize: number = 15;
  currentPage: number = 1;

  get totalPages(): number {
    return Math.ceil((this.Hitos?.length || 0) / this.pageSize);
  }

  get pagedHitos(): Hitos[] {
    let arr = this.Hitos ? [...this.Hitos] : [];
    if (this.orden === 'numero') {
      arr.sort((a, b) => a.IdHito - b.IdHito);
    } else if (this.orden === 'alfabeto') {
      arr.sort((a, b) => (a.NombreHito || '').localeCompare(b.NombreHito || '', 'es', {sensitivity: 'base'}));
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return arr.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  Hitos:Hitos[];
  idHitos:number;
  Hoy = new Date();
  Editor:boolean=false;
  IndexUpdate:number;
  IndexEliminar:number;
  //CamposFormulario
  clpCalendario: string = '#999999';
  chkCalendario;
  //CamposEditar
  txtEditNombreHito="";
  chkEditObligatorio;
  chkEditCalendario=false;
  txtEditNombreCalendario="";
  txtEditColCalendario="";

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
  urlBase:string=environment.urlBase;
  controlador:string="Hitos/";
  urlFull:string=this.urlBase+this.controlador;

  constructor(private route: Router, private http: HttpClient) { 

    this.Loading=false;
    this.LoadingTabla=true;
    this.usuario=JSON.parse(localStorage.usuario);

    this.GetHitos();

    

  }

  ngOnInit() {
    // Enfocar el campo principal después de un delay
    setTimeout(() => {
      try {
        const inputElement = document.getElementById('txtNombreHito');
        if (inputElement) {
          inputElement.focus();
        }
      } catch (error) {
        console.log('Could not focus main input:', error);
      }
    }, 100);

    // Inicializar color picker de forma segura
    try {
      if (typeof $ !== 'undefined' && $.fn.minicolors) {
        $('#colorpickeri').minicolors({ animationEasing: 'swing'});
        $('#txtEditColCalendario').minicolors({ animationEasing: 'swing'});
      }
    } catch (error) {
      console.log('Color picker initialization failed:', error);
    }

    // Cargar scripts externos de forma segura
    try {
      if (typeof $ !== 'undefined') {
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js")
          .fail(() => console.log('Settings script failed to load'));
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js")
          .fail(() => console.log('App script failed to load'));
      }
    } catch (error) {
      console.log('External scripts loading failed:', error);
    }
  }

  GetHitos() {
    let pag = this.urlFull;
    
    this.http.get<any[]>(pag)
      .subscribe({
        next: (Hito) => {
          // Eliminar duplicados basándose en IdHito
          const hitosUnicos = Hito.reduce((acc, current) => {
            const existe = acc.find((item: any) => item.IdHito === current.IdHito);
            if (!existe) {
              acc.push(current);
            }
            return acc;
          }, [] as any[]);
          
          this.Hitos = hitosUnicos;
          this.currentPage = 1;
          this.Loading = false;
          this.LoadingTabla = false;
        },
        error: (err) => {
          console.error('Error loading hitos:', err);
          this.Loading = false;
          this.LoadingTabla = false;
        }
      });
  }

  Agregar(form: NgForm){
    let loc = this;
    let pag = this.urlFull;
    if (this.Validar(form)){
      this.Loading = true;
      var Hito = new Hitos(
        0, // IdHito
        form.value.txtNombreHito, // NombreHito
        form.value.chkObligatorio || false, // Obligatorio
        this.chkCalendario, // MostrarEnCalendario
        form.value.txtNombreCalendario, // NombreCalendario
        form.value.txtColCalendario, // ColorCalendario
        this.retFecha(this.Hoy), // FechaCreacion
        this.usuario.idUsuario, // IdUsuarioCreador
        "", // FechaRemocion
        0, // IdUsuarioRemovedor
        true, // Activo
        "" // FechaCompromiso
      );

      if (form.value.chkObligatorio === undefined){
        Hito.Obligatoria = false;
      }

      if (this.chkCalendario === undefined){
        Hito.Calendarizada = false;
      }

      //console.log(Hito)

      this.http.post<any>(this.urlFull, Hito)
        .subscribe({
          next: (result) => {
            // Mostrar SweetAlert de éxito y recargar al aceptar
            Hito.IdHito = result.idArea;
            try {
              Swal.fire({
                title: 'Hito creado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              }).then((res: any) => {
                if (res && res.isConfirmed) {
                  window.location.reload();
                }
              });
            } catch (e) {
              this.msg = "Hito creado correctamente";
              this.Mensaje();
              this.GetHitos();
              form.reset();
              $("#txtNombreHito").focus();
            }
          },
          error: (xhr) => {
            this.GetHitos();
            form.reset();
            $("#txtNombreHito").focus();
          }
        });
    }
  }

  Editar(i:number){
    console.log('Editando hito:', this.Hitos[i]);
    
    // Limpiar errores previos
    this.errorEdit = ["", "", ""];
    
    // Cargar datos del hito seleccionado
    this.txtEditNombreHito = this.Hitos[i].NombreHito;
    this.chkEditObligatorio = this.Hitos[i].Obligatoria;
    this.chkEditCalendario = this.Hitos[i].Calendarizada;
    this.txtEditNombreCalendario = this.Hitos[i].NombreCalendario || '';
    
    // Manejar el color del calendario
    if (this.Hitos[i].ColorCalendario && this.Hitos[i].ColorCalendario !== "" && this.Hitos[i].ColorCalendario !== null) {
      this.txtEditColCalendario = this.Hitos[i].ColorCalendario.toUpperCase();
    } else {
      this.txtEditColCalendario = '';
    }
    
    this.IndexUpdate = i;
    this.VerPopUp();
    
    // Enfocar el campo de entrada después de un delay más largo para asegurar que el modal esté completamente cargado
    setTimeout(() => {
      try {
        const inputElement = document.getElementById('txtEditNombreHito') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          inputElement.select();
        }
      } catch (error) {
        console.log('Could not focus input element:', error);
        // Fallback con jQuery
        try {
          $("#txtEditNombreHito").focus();
        } catch (jqError) {
          console.log('jQuery focus also failed:', jqError);
        }
      }
    }, 500);
  }

  Actualizar(form: NgForm) {
    if (this.ValidarEdit()) {
      this.Loading = true;
      let pag = this.urlFull + this.Hitos[this.IndexUpdate].IdHito;

      // Crear objeto actualizado con los valores del formulario
      let hitoActualizado = {
        ...this.Hitos[this.IndexUpdate],
        NombreHito: this.txtEditNombreHito,
        Obligatorio: this.chkEditObligatorio,
        Obligatoria: this.chkEditObligatorio,
        MostrarEnCalendario: this.chkEditCalendario,
        Calendarizada: this.chkEditCalendario,
        NombreCalendario: this.chkEditCalendario ? this.txtEditNombreCalendario : '',
        ColorCalendario: this.chkEditCalendario ? this.txtEditColCalendario.toUpperCase() : ''
      };

      console.log('Actualizando hito:', hitoActualizado);

      this.http.post<any>(pag, hitoActualizado)
        .subscribe({
          next: (result) => {
            this.Loading = false;
              // Mostrar SweetAlert de éxito para edición
              try {
                Swal.fire({
                  title: 'Hito editado correctamente',
                  icon: 'success',
                  confirmButtonText: 'Aceptar'
                }).then((res: any) => {
                  if (res && res.isConfirmed) {
                    window.location.reload();
                  } else {
                    this.GetHitos(); // Recargar la lista
                    this.OcultarPopUp();
                    $("#txtNombreHito").focus();
                  }
                });
              } catch (e) {
                this.msg = "Hito editado correctamente";
                this.Mensaje();
                this.GetHitos(); // Recargar la lista
                this.OcultarPopUp();
                $("#txtNombreHito").focus();
              }
          },
          error: (xhr) => {
            console.error('Error al actualizar hito:', xhr);
            this.Loading = false;
            this.msg = "Error al actualizar el hito. Por favor intente nuevamente.";
            this.Mensaje();
            this.GetHitos();
          }
        });
    }
  }

  Eliminar() {
    this.Loading = true;
    let hito: Hitos = this.Hitos[this.IndexEliminar];
    let pag = this.urlFull + this.Hitos[this.IndexEliminar].IdHito;
    hito.IdUsuarioRemovedor = this.usuario.idUsuario;
    console.log(hito);
    
    this.http.post<any>(pag, hito)
      .subscribe({
        next: (result) => {
          // Mostrar SweetAlert de éxito al eliminar
          try {
            Swal.fire({
              title: 'Hito eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then((res: any) => {
              if (res && res.isConfirmed) {
                window.location.reload();
              } else {
                this.GetHitos();
                $("#txtNombreHito").focus();
              }
            });
          } catch (e) {
            this.msg = "Hito eliminado correctamente";
            this.Mensaje();
            this.GetHitos();
            $("#txtNombreHito").focus();
          }
        },
        error: (xhr) => {
          this.GetHitos();
        }
      });
  }


  // Ya no se necesita función Color(), el color picker es nativo Angular

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

  VerPopUp(){
    // Usar Bootstrap modal API en lugar de manipular directamente las clases
    try {
      const modalElement = document.getElementById('exampleModalLong');
      if (modalElement) {
        // Remover aria-hidden antes de mostrar el modal
        modalElement.removeAttribute('aria-hidden');
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        modalElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalElement.style.overflowY = 'scroll';
        
        // Prevenir scroll del body
        document.body.style.overflowY = 'hidden';
        
        // Asegurar que el modal sea accesible
        modalElement.setAttribute('aria-modal', 'true');
        modalElement.removeAttribute('aria-hidden');
      }
    } catch (error) {
      console.error('Error showing modal:', error);
      // Fallback al método anterior si hay problemas
      $("#exampleModalLong").attr('class', 'modal fade show');
      $("#exampleModalLong").attr("style", "display: block;background-color:rgba(0, 0, 0, 0.5);overflow-y: scroll;");
      $("#exampleModalLong").removeAttr('aria-hidden');
      $("body").attr("style", "overflow-y: hidden;");
    }
  }

  OcultarPopUp(){
    // Usar método más limpio para ocultar el modal
    try {
      const modalElement = document.getElementById('exampleModalLong');
      if (modalElement) {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.style.backgroundColor = '';
        modalElement.style.overflowY = '';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        
        // Restaurar scroll del body
        document.body.style.overflowY = '';
      }
    } catch (error) {
      console.error('Error hiding modal:', error);
      // Fallback al método anterior
      $("#exampleModalLong").attr('class', 'modal fade');
      $("#exampleModalLong").attr("style", "");
      $("body").attr("style", "");
    }
    
    // Limpiar errores al cerrar
    this.errorEdit = ["", "", ""];
  }

  Confirmacion(i){
    // Usar SweetAlert para confirmación si está disponible; si no, usar confirm() nativo
    this.IndexEliminar = i;
    try {
      if (typeof Swal !== 'undefined' && Swal && Swal.fire) {
        Swal.fire({
          title: '¿Está seguro de eliminar este elemento?',
          text: 'Esta acción no se puede deshacer.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d'
        }).then((result: any) => {
          if (result && result.isConfirmed) {
            this.Eliminar();
          }
        });
      } else {
        // Fallback nativo
        const ok = window.confirm('¿Está seguro de eliminar este elemento? Esta acción no se puede deshacer.');
        if (ok) this.Eliminar();
      }
    } catch (error) {
      // Último recurso: fallback nativo
      const ok = window.confirm('¿Está seguro de eliminar este elemento? Esta acción no se puede deshacer.');
      if (ok) this.Eliminar();
    }
  }

  OcultarConfirmacion() {
    try {
      const modalElement = document.getElementById('Confirm');
      if (modalElement) {
        // Hide using Bootstrap modal API if available
        if (typeof $ !== 'undefined' && $(modalElement).modal) {
          $(modalElement).modal('hide');
        }
        // Always remove 'show' class and reset styles
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.style.backgroundColor = '';
        modalElement.style.overflowY = '';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        document.body.style.overflowY = '';
      }
    } catch (error) {
      console.error('Error hiding confirmation modal:', error);
      // Fallback
      if (typeof $ !== 'undefined') {
        $('#Confirm').modal('hide');
        $('#Confirm').attr('class', 'modal fade');
        $('#Confirm').attr('style', '');
        $('body').attr('style', '');
      }
    }
    return false;
  }

  Mensaje(){
    try {
      const modalElement = document.getElementById('Mensaje');
      if (modalElement) {
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        modalElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalElement.style.overflowY = 'scroll';
        modalElement.removeAttribute('aria-hidden');
        modalElement.setAttribute('aria-modal', 'true');
        
        document.body.style.overflowY = 'hidden';
      }
    } catch (error) {
      console.error('Error showing message modal:', error);
      // Fallback
      $("#Mensaje").attr('class', 'modal fade show');
      $("#Mensaje").attr("style", "display: block;background-color:rgba(0, 0, 0, 0.5);overflow-y: scroll;");
      $("#Mensaje").removeAttr('aria-hidden');
      $("body").attr("style", "overflow-y: hidden;");
    }
  }

  OcultarMensaje(){
    try {
      const modalElement = document.getElementById('Mensaje');
      if (modalElement) {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.style.backgroundColor = '';
        modalElement.style.overflowY = '';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        
        document.body.style.overflowY = '';
      }
    } catch (error) {
      console.error('Error hiding message modal:', error);
      // Fallback
      $("#Mensaje").attr('class', 'modal fade');
      $("#Mensaje").attr("style", "");
      $("body").attr("style", "");
    }
  }

  Validar(form: NgForm){
    let bol:boolean=true;
    // El valor del color ya está en clpCalendario y en el ngModel
    if (form.value.txtNombreHito=="" || form.value.txtNombreHito ===null){
      this.error[0]="Debe ingresar valor"
      bol= false
    }
    if (this.chkCalendario && (form.value.txtNombreCalendario==""|| form.value.txtNombreCalendario ===null)){
      this.error[1]="Debe ingresar valor"
      bol= false
    }
    if (this.chkCalendario && (form.value.txtColCalendario==""|| form.value.txtColCalendario ===null)){
      this.error[2]="Debe ingresar valor"
      bol= false
    }
    if(!this.chkCalendario){
      form.value.txtNombreCalendario="";
      form.value.txtColCalendario="";
    }
    return bol
    }

    ValidarEdit(){
      let bol:boolean = true;
      this.errorEdit = ["", "", ""];
      // Validar nombre del hito
      if (!this.txtEditNombreHito || this.txtEditNombreHito.trim() === "") {
        this.errorEdit[0] = "Debe ingresar un nombre para el hito";
        bol = false;
      }
      // Validar color hexadecimal si calendario está habilitado
      if (this.chkEditCalendario) {
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!hexColorRegex.test(this.txtEditColCalendario)) {
          this.errorEdit[2] = "El color debe estar en formato hexadecimal (ej: #FF0000)";
          bol = false;
        }
      }
      return bol;
    }

    Clean(){
      // Limpiar mensajes de error
      this.error = ["", "", ""];
      this.errorEdit = ["", "", ""];
    }

}
