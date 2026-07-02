// ...existing code up to end of class...
import { Component, OnInit } from '@angular/core';
import { MandanteFilterPipe } from './mandante-filter.pipe';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainComponent } from '../../main/main.component';
import { environment } from '../../../environments/environment';

declare var jQuery: any;
declare var $: any;



// Clase Mandante
class Mandante {
  IdMandante: number = 0;
  NombreMandante: string = '';
  FechaCreacion: string = '';
  IdUsuarioCreador: number = 0;
  FechaRemocion: string = '';
  IdUsuarioRemovedor: number = 0;
  Activo: boolean = true;

  constructor(id: number, nom: string, creacion: string, crea: number, remocion: string, removedor: number, act: boolean) {
    this.IdMandante = id;
    this.NombreMandante = nom;
    this.FechaCreacion = creacion;
    this.IdUsuarioCreador = crea;
    this.FechaRemocion = remocion;
    this.IdUsuarioRemovedor = removedor;
    this.Activo = act;
  }
}

interface Ejecutivo {
  IdEjecutivos: number;
  NombreEjecutivo: string;
  Telefono: string;
  Celular: string;
  Correo: string;
  FechaCreacion: string;
  IdMandante: number;
  IdUsuarioRemovedor: number;
  IdUsuarioCreador: number;
}

@Component({
  selector: 'app-mandantes',
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent],
  templateUrl: './mandantes.component.html',
  styleUrls: ['./mandantes.component.css']
})
export class MandantesComponent implements OnInit {
  editEjecutivoId: number | null = null;
  editEjecutivoData: any = {};

  editarEjecutivo(eje: Ejecutivo) {
    this.editEjecutivoId = eje.IdEjecutivos;
    this.editEjecutivoData = { ...eje };
  }

  guardarEdicionEjecutivo() {
    if (!this.editEjecutivoId) return;
    const url = `/api/Ejecutivos/${this.editEjecutivoId}`;
    this.http.put<any>(url, this.editEjecutivoData)
      .subscribe({
        next: () => {
          this.editEjecutivoId = null;
          this.editEjecutivoData = {};
          this.mostrarEjecutivos(this.mandanteExpandido!);
        },
        error: () => {
          this.errorEjecutivo = 'Error al editar ejecutivo';
        }
      });
  }

  cancelarEdicionEjecutivo() {
    this.editEjecutivoId = null;
    this.editEjecutivoData = {};
  }
  // Editar ejecutivo (puedes expandir la lógica según tus necesidades)

  // Eliminar ejecutivo
  eliminarEjecutivo(eje: Ejecutivo) {
    if (!confirm('¿Seguro que desea eliminar este ejecutivo?')) return;
    const url = `${this.urlBase}Ejecutivos/${eje.IdEjecutivos}`;
    const params = new URLSearchParams();
    console.log(eje);
    
    params.set('IdEjecutivos', eje.IdEjecutivos.toString());
    params.set('NombreEjecutivo', eje.NombreEjecutivo);
    params.set('Telefono', eje.Telefono);
    params.set('Celular', eje.Celular);
    params.set('Correo', eje.Correo);
    params.set('idMandante', this.mandanteExpandido.toString());
    params.set('Activo', 'false');

    this.http.post<any>(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    })
      .subscribe({
      next: () => {
        this.mostrarEjecutivos(this.mandanteExpandido!);
      },
      error: () => {
        this.errorEjecutivo = 'Error al eliminar ejecutivo';
      }
      });
  }
  // Método para editar mandante
  Editar(index: number) {
    this.Editor = true;
    this.IndexUpdate = index;
    this.EditNombreMandante = this.pagedMandantes[index].NombreMandante;
    this.errorEdit = '';
  }

  // Método para mostrar confirmación de eliminación
  Confirmacion(index: number) {
    this.IndexEliminar = index;
    document.body.classList.add('modal-open');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.id = 'modal-backdrop-confirm';
    document.body.appendChild(backdrop);
  }
  Validar(form: NgForm): boolean {
    this.error = '';
    const txtMandante = document.getElementById('txtMandante') as HTMLInputElement;
    if (form.value.txtMandante == "" || form.value.txtMandante === null) {
      if (txtMandante) {
        txtMandante.className = "form-control error";
      }
      this.error = "Debe ingresar valor";
      return false;
    }
    if (txtMandante) {
      txtMandante.className = "form-control";
    }
    return true;
  }

  ValidarEdit(): boolean {
    this.errorEdit = '';
    const txtMandanteEdit = document.getElementById('txtMandanteEdit') as HTMLInputElement;
    if (this.EditNombreMandante == "" || this.EditNombreMandante === null) {
      if (txtMandanteEdit) {
        txtMandanteEdit.className = "form-control error";
      }
      this.errorEdit = "Debe ingresar valor";
      return false;
    }
    if (txtMandanteEdit) {
      txtMandanteEdit.className = "form-control";
    }
    return true;
  }

  Mensaje() {
    document.body.classList.add('modal-open');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.id = 'modal-backdrop-message';
    document.body.appendChild(backdrop);
  }
  // Add missing methods referenced in the template

  Agregar(form: NgForm) {
    if (this.Validar(form)) {
      this.Loading = true;
      const mandante: Mandante = new Mandante(
        0,
        form.value.txtMandante,
        this.retFecha(this.Hoy),
        this.usuario.idUsuario,
        "",
        0,
        true
      );
      this.http.post<any>(this.urlFull, mandante)
        .subscribe({
          next: (result) => {
            this.msg = "Se ha creado el elemento";
            this.Mensaje();
            mandante.IdMandante = result.idArea;
            this.GetMandnate();
            form.value.txtMandante = "";
            form.reset();
            if (typeof $ !== 'undefined') {
              $("#txtMandante").focus();
            }
          },
          error: (xhr) => {
            this.GetMandnate();
            form.reset();
          }
        });
    }
  }

  Clean() {
    this.error = '';
    const txtMandante = document.getElementById('txtMandante') as HTMLInputElement;
    if (txtMandante) {
      txtMandante.className = "form-control";
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  OcultarPopUp() {
    this.Editor = false;
    this.EditNombreMandante = '';
    this.IndexUpdate = -1;
    this.errorEdit = '';
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  Actualizar(form: NgForm) {
    if (this.ValidarEdit()) {
      this.Loading = true;
      let pag = this.urlFull + this.Mandantes[this.IndexUpdate].IdMandante;
      this.Mandantes[this.IndexUpdate].NombreMandante = this.EditNombreMandante;
      this.http.put<any>(pag, this.Mandantes[this.IndexUpdate])
        .subscribe({
          next: (result) => {
            this.msg = "Se ha actualizado el elemento";
            this.Mensaje();
            this.GetMandnate();
            form.reset();
            this.OcultarPopUp();
            if (typeof $ !== 'undefined') {
              $("#txtMandante").focus();
            }
          },
          error: (xhr) => {
            this.Loading = false;
            this.GetMandnate();
          }
        });
    }
  }

  OcultarConfirmacion() {
    this.IndexEliminar = -1;
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('modal-backdrop-confirm');
    if (backdrop) {
      backdrop.remove();
    }
    return false;
  }

  Eliminar() {
    this.Loading = true;
    let mandante: Mandante = this.Mandantes[this.IndexEliminar];
    let pag = this.urlFull + this.Mandantes[this.IndexEliminar].IdMandante;
    mandante.IdUsuarioRemovedor = this.usuario.idUsuario;
    this.http.post<any>(pag, mandante)
      .subscribe({
        next: (result) => {
          this.OcultarConfirmacion();
          this.GetMandnate();
          this.msg = "Se ha eliminado el elemento";
          this.Mensaje();
          if (typeof $ !== 'undefined') {
            $("#txtMandante").focus();
          }
        },
        error: (xhr) => {
          this.GetMandnate();
        }
      });
  }

  OcultarMensaje() {
    this.msg = '';
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('modal-backdrop-message');
    if (backdrop) {
      backdrop.remove();
    }
  }
  // ...existing code...

  // Fetch mandantes from API
  GetMandnate() {
    let pag = this.urlFull;
    this.http.get<any[]>(pag)
      .subscribe({
        next: (Mandante) => {
          this.Mandantes = Mandante;
          this.currentPage = 1; // Reiniciar a la primera página al cargar
          this.Loading = false;
          this.LoadingTabla = false;
        },
        error: (err) => {
          console.error('Error loading mandantes:', err);
          this.Loading = false;
          this.LoadingTabla = false;
        }
      });
  }

  // Format date as dd/mm/yyyy
  retFecha(now: Date): string {
    let dd: string | number = now.getDate();
    let mm: string | number = now.getMonth() + 1; //January is 0!
    let yyyy = now.getFullYear();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    // Solo fecha, sin hora
    return `${dd}/${mm}/${yyyy}`;
  }
  mandanteSearch: string = '';
  Mandantes: Mandante[] = [];
  // Paginación
  pageSize: number = 20;
  currentPage: number = 1;
  get filteredMandantes(): Mandante[] {
    if (!this.mandanteSearch || this.mandanteSearch.trim() === '') {
      return this.Mandantes;
    }
    const lowerSearch = this.mandanteSearch.toLowerCase();
    return this.Mandantes.filter(item =>
      item.NombreMandante && item.NombreMandante.toLowerCase().includes(lowerSearch)
    );
  }
  get pagedMandantes(): Mandante[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMandantes.slice(start, start + this.pageSize);
  }
  get totalPages(): number {
    return Math.ceil((this.filteredMandantes?.length || 0) / this.pageSize);
  }
  Hoy = new Date();
  Editor:boolean=false;
  IndexUpdate:number = -1;
  EditNombreMandante:string = '';
  IndexEliminar:number = -1;
  //Errores
  error: string = '';
  errorEdit: string = '';
  //Generales
  usuario:any={}
  //Cargando
  Loading:boolean;
  LoadingTabla:boolean;
  //Mensajes
  msg:string = '';
  //Url
  urlBase:string = environment.urlBase;
  controlador:string="Mandante/";
  urlFull:string=this.urlBase+this.controlador;

  // Ejecutivos desplegables
  mandanteExpandido: number | null = null;
  ejecutivosMandante: Ejecutivo[] = [];
  loadingEjecutivos: boolean = false;
  nuevoEjecutivo = { NombreEjecutivo: '', Telefono: '', Celular: '', Correo: '' };
  errorEjecutivo: string = '';
  errorEjecutivoCampos: string[] = ['', '', '', ''];

  constructor(private route: Router, private http: HttpClient) {
    this.Loading = false;
    this.LoadingTabla = true;
    this.GetMandnate();
    this.usuario = JSON.parse(localStorage.usuario);
  }

  ngOnInit() {
    // Verificar si jQuery está disponible antes de usarlo
    if (typeof $ !== 'undefined') {
      $("#txtMandante").focus();
      // Solo cargar scripts si están disponibles
      try {
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js", undefined, function(jqxhr, settings, exception) {
          if (exception) {
            console.warn('Settings script not available');
          }
        });
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js", undefined, function(jqxhr, settings, exception) {
          if (exception) {
            console.warn('App script not available');
          }
        });
      } catch (error) {
        console.warn('jQuery scripts not available:', error);
      }
    } else {
      // Si jQuery no está disponible, usar vanilla JavaScript
      const txtMandante = document.getElementById('txtMandante') as HTMLInputElement;
      if (txtMandante) {
        txtMandante.focus();
      }
    }
  }

  // --- Ejecutivos accordion logic ---
  mostrarEjecutivos(mandanteId: number) {
    if (this.mandanteExpandido === mandanteId) {
      this.mandanteExpandido = null;
      this.ejecutivosMandante = [];
      return;
    }
    this.mandanteExpandido = mandanteId;
    this.loadingEjecutivos = true;
    this.http.get<Ejecutivo[]>(`${this.urlBase}Ejecutivos/GetEjecutivosByidMandante/idMandante=${mandanteId}`)
      .subscribe({
        next: (data) => {
          this.ejecutivosMandante = data;
          this.loadingEjecutivos = false;
        },
        error: (err) => {
          this.ejecutivosMandante = [];
          this.loadingEjecutivos = false;
        }
      });
  }

  agregarEjecutivo(form: NgForm) {
    this.errorEjecutivo = '';
    this.errorEjecutivoCampos = ['', '', '', ''];
    let valido = true;
    // Validación por campo
    if (!this.nuevoEjecutivo.NombreEjecutivo) {
      this.errorEjecutivoCampos[0] = 'Debe ingresar el nombre';
      valido = false;
    }
    if (!this.nuevoEjecutivo.Telefono) {
      this.errorEjecutivoCampos[1] = 'Debe ingresar el teléfono';
      valido = false;
    } else if (!/^\+?\d{9,15}$/.test(this.nuevoEjecutivo.Telefono)) {
      this.errorEjecutivoCampos[1] = 'El teléfono debe tener entre 9 y 15 dígitos, puede iniciar con +';
      valido = false;
    }
    if (!this.nuevoEjecutivo.Celular) {
      this.errorEjecutivoCampos[2] = 'Debe ingresar el celular';
      valido = false;
    }
    if (!this.nuevoEjecutivo.Correo) {
      this.errorEjecutivoCampos[3] = 'Debe ingresar el correo';
      valido = false;
    } else if (!/^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i.test(this.nuevoEjecutivo.Correo)) {
      this.errorEjecutivoCampos[3] = 'Correo no válido';
      valido = false;
    }
    if (!valido) return;
    const ejecutivo: Ejecutivo = {
      IdEjecutivos: 0,
      NombreEjecutivo: this.nuevoEjecutivo.NombreEjecutivo,
      Telefono: this.nuevoEjecutivo.Telefono,
      Celular: this.nuevoEjecutivo.Celular,
      Correo: this.nuevoEjecutivo.Correo,
      FechaCreacion: this.retFecha(this.Hoy),
      IdMandante: this.mandanteExpandido!,
      IdUsuarioRemovedor: 0,
      IdUsuarioCreador: this.usuario.idUsuario
    };
    const params = new URLSearchParams();
    params.set('NombreEjecutivo', ejecutivo.NombreEjecutivo);
    params.set('Telefono', ejecutivo.Telefono);
    params.set('Celular', ejecutivo.Celular);
    params.set('Correo', ejecutivo.Correo);
    params.set('FechaCreacion', ejecutivo.FechaCreacion);
    params.set('IdMandante', ejecutivo.IdMandante.toString());
    params.set('IdUsuarioRemovedor', ejecutivo.IdUsuarioRemovedor.toString());
    params.set('IdUsuarioCreador', ejecutivo.IdUsuarioCreador.toString());

    this.http.post<any>('/api/Ejecutivos/', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    })
      .subscribe({
      next: (result) => {
        this.nuevoEjecutivo = { NombreEjecutivo: '', Telefono: '', Celular: '', Correo: '' };
        form.reset();
        this.mostrarEjecutivos(this.mandanteExpandido!);
      },
      error: (err) => {
        this.errorEjecutivo = 'Error al crear ejecutivo: ' + (err?.message || err?.statusText || JSON.stringify(err));
        console.error('Error al crear ejecutivo:', err);
      }
      });
  }

  limpiarErrorEjecutivoCampo(idx: number) {
    this.errorEjecutivoCampos[idx] = '';
  }
  // ...existing code...
}
