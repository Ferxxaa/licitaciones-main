// ...existing code...
import { Component, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainComponent } from '../../main/main.component';
import { environment } from '../../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificacionesService } from '../../services/notificaciones.service';

declare var jQuery: any;
declare var $: any;
declare var Swal: any;

// Clases necesarias
class Areas {
  IdArea: number = 0;
  NombreArea: string = '';
  // Más propiedades según sea necesario
}

class Mandante {
  IdMandante: number = 0;
  NombreMandante: string = '';
}

class Ejecutivos {
  IdEjecutivos: number = 0;
  NombreEjecutivo: string = '';
  IdMandante: number = 0;
}

class Hitos {
  IdHitos: number = 0;
  IdHito: number = 0; // Alias para compatibilidad
  NombreHito: string = '';
  Obligatorio: boolean = false;
}

class Licitaciones {
  IdLicitacion: number = 0;
  NombreLicitacion: string = '';
  descripcion: string = ''; // Usar minúscula para compatibilidad backend
  NumeroPropuesta: string = ''; // Agregado para compatibilidad
  OfertaInicial: number = 0; // Agregado para compatibilidad
  idEstado: number = 0; // Agregado para compatibilidad
  CodigoMandante: string = '';
  Monto: number = 0;
  Superficie: number = 0;
  Competitividad: string = '';
  IdArea: number = 0;
  IdEjecutivo: number = 0;
  IdMandante: number = 0;
  FechaCreacion: string = '';
  IdUsuarioCreador: number = 0;
  FechaRemocion: string = '';
  IdUsuarioRemovedor: number = 0;
  Activo: boolean = true;
  // Nuevos campos para contratos marco
  TipoLicitacion: string = 'normal'; // 'normal' o 'contrato_marco'
  IdContratoMarco?: number | null = null; // ID del contrato marco padre (opcional)
  EsContratoMarco: boolean = false; // Indica si esta licitación es un contrato marco
}

@Component({
  selector: 'app-licitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent],
  templateUrl: './licitaciones.component.html',
  styleUrls: ['./licitaciones.component.css']
})
export class LicitacionesComponent implements OnInit {
  EliminarLicitacionHija(id: number) {
    if (!id) return;
    if (!confirm('¿Está seguro de eliminar esta licitación hija?')) return;
    const url = this.urlFull + id;
    this.http.delete(url).subscribe({
      next: () => {
        this.msg = 'Licitación hija eliminada correctamente';
        this.CargarLicitacionesYContratos();
      },
      error: () => {
        this.msg = 'Error al eliminar la licitación hija';
      }
    });
  }
  Estados: any[] = [];
  drdEstado: number = 0;
  // Lista auxiliar para mantener el orden visual de los hitos a incorporar
  get HitosOrdenados() {
    if (!this._ordenHitosOriginal || this._ordenHitosOriginal.length === 0) {
      return this.Hitos;
    }
    // Renderiza los hitos en el orden original, excluyendo los que ya están en HitosSelect
    return this._ordenHitosOriginal
      .map(id => this.Hitos.find(h => h.IdHito === id))
      .filter(h => !!h);
  }
  // Para mantener el orden original de los hitos
  _ordenHitosOriginal: number[] = [];
  // Paginación de la tabla de licitaciones
  // Método para cargar y combinar licitaciones y contratos marco
  CargarLicitacionesYContratos() {
    this.Loading = true;
    this.LoadingTabla[2] = true;
    // Petición a licitaciones normales
    this.http.get<any[]>(this.urlFull + 'GetValuesJoin/join')
      .subscribe(licitaciones => {
        // Petición a contratos marco
        this.http.get<any[]>(this.urlBFF + 'contrato_m')
          .subscribe(contratos => {
            let licitacionesAplanadas = [...licitaciones];
            const contratosFormateados = contratos.map(c => {
              // Mapear hijas (si existen)
              let hijas = [];
              if (Array.isArray(c.licitaciones)) {
                hijas = c.licitaciones.map(hija => ({
                  ...hija,
                  EsHijaContratoMarco: true,
                  IdContratoMarco: c.id,
                  NombreContratoMarco: c.name,
                  TipoLicitacion: 'normal',
                  EsContratoMarco: false
                }));
              }
              // Agregar hijas a la lista aplanada
              licitacionesAplanadas = [...licitacionesAplanadas, ...hijas];
              // Retornar el contrato marco como fila principal
              return {
                IdLicitacion: c.id,
                NombreLicitacion: c.name,
                descripcion: c.description || c.name,
                NumeroPropuesta: c.filename,
                OfertaInicial: c.views,
                Monto: c.views,
                CodigoMandante: '',
                IdArea: 0,
                NombreArea: '',
                IdMandante: 0,
                NombreMandante: '',
                IdEjecutivo: 0,
                NombreEjecutivo: '',
                idEstado: 1,
                Estado: '',
                Competitividad: '',
                FechaCreacion: '',
                FechaOferta: '',
                Superficie: 0,
                Activo: true,
                TipoLicitacion: 'contrato_marco',
                IdContratoMarco: null,
                EsContratoMarco: true,
                isPublished: c.isPublished,
                Hijas: hijas
              };
            });
            // Unir contratos marco como filas principales y las licitaciones (normales e hijas)
            this.Licitaciones = [...contratosFormateados, ...licitacionesAplanadas];
            this.ContratosMarco = contratos;
            this.Loading = false;
            this.LoadingTabla[2] = false;
            this.licitacionesCurrentPage = 1;
          });
      });
  }
  licitacionesPageSize: number = 10;
  licitacionesCurrentPage: number = 1;
  get licitacionesTotalPages(): number {
    return Math.ceil((this.Licitaciones?.length || 0) / this.licitacionesPageSize);
  }
  get pagedLicitaciones(): any[] {
    const start = (this.licitacionesCurrentPage - 1) * this.licitacionesPageSize;
    return this.Licitaciones?.slice(start, start + this.licitacionesPageSize) || [];
  }

  nextLicitacionesPage() {
    if (this.licitacionesCurrentPage < this.licitacionesTotalPages) {
      this.licitacionesCurrentPage++;
    }
  }

  prevLicitacionesPage() {
    if (this.licitacionesCurrentPage > 1) {
      this.licitacionesCurrentPage--;
    }
  }

  goToLicitacionesPage(page: number) {
    if (page >= 1 && page <= this.licitacionesTotalPages) {
      this.licitacionesCurrentPage = page;
    }
  }

  Areas:Areas[];
  Mandantes:Mandante[];
  Ejecutivos:Ejecutivos[];
  Hitos:Hitos[];
  HitosSelect:Hitos[];
  Licitaciones:any[] = [];
  ContratosMarco:any[]; // Para almacenar contratos marco disponibles
  idLicitaciones:number;
  Hoy = new Date();
  Editor:boolean;
  IndexUpdate:number;
  IndexEliminar: number = 0;
  //Controles
  txtNombreLicitacion;
  txtCodigoMan;
  drdMandantes;
  txtMonto;
  txtMontoInicial;
  txtSuperficie;
  drdCompetitividad;
  drdAreas;
  drdEjecutivos;
  drdTipoLicitacion = 'normal'; // Nuevo: tipo de licitación (normal o contrato_marco)
  drdContratoMarco = 0; // Nuevo: ID del contrato marco padre
  
  // Nuevas propiedades para búsqueda de Mandantes
  txtBuscarMandante: string = '';
  mandantesFiltrados: Mandante[] = [];
  mostrarListaMandantes: boolean = false;
  mandanteSeleccionado: Mandante | null = null;
  //Editar
  drdAreasEdit;
  txtNombreLicitacionEdit;
  txtCodigoManEdit;
  txtMontoEdit;
  drdMandantesEdit;
  drdEjecutivosEdit;
  txtSuperficieEdit;
  drdCompetitividadEdit;
  drdTipoLicitacionEdit = 'normal'; // Nuevo: para edición
  drdContratoMarcoEdit = 0; // Nuevo: para edición
  HitosEdit:Hitos[];
  HitosSelectEdit:Hitos[];

  //Errores
  error=[];
  errorEdit=[];

  //Generales
  usuario:any={}

  //Cargando
  Loading:boolean;
  LoadingTabla:boolean[]=[true,true,true];
  LoadingEjecutivos:boolean = false;

  //Mensajes
  msg:string;

  //Url
  urlBase:string=environment.urlBase;
  controlador:string="Licitaciones/";
  urlFull:string=this.urlBase+this.controlador;

  urlBFF:string=environment.urlBFF;

  constructor(
    private _router: Router, 
    private http: HttpClient,
    private notificacionesService: NotificacionesService
  ) { 
    // Carga Estados solo si no están cargados
    this.http.get<any[]>(this.urlBase+'Estado/')
      .subscribe(Estados => {
        this.Estados = Estados;
        // Si no existe 'Preadjudicada', agregarlo manualmente
        if (!this.Estados.some(e => e.NombreEstado === 'Preadjudicada')) {
          this.Estados.push({ IdEstado: 99, NombreEstado: 'Preadjudicada' });
        }
      });

    this.Loading=false;
    this.LoadingTabla[0]=true;
    this.LoadingTabla[1]=true;
    this.LoadingTabla[2]=true;
    this.usuario=JSON.parse(localStorage.usuario);

    //Carga Areas
    this.http.get<any[]>(this.urlBase+'Area/')
    .subscribe({
      next: (Area) => {
        this.Areas=Area;
      },
      error: () => {
        this.LoadingTabla[0]=false;
      },
      complete: () => {
        this.LoadingTabla[0]=false;
      }
    })
    


    //Carga Mandante
    this.http.get<any[]>(this.urlBase+'Mandante/')
    .subscribe({
      next: (Mandante) => {
        this.Mandantes=Mandante;
        this.mandantesFiltrados = Mandante; // Inicializar la lista filtrada
      },
      error: () => {
        this.LoadingTabla[1]=false;
      },
      complete: () => {
        this.LoadingTabla[1]=false;
      }
    })

    this.CargaHitos();
    
    this.GetLicitaciones();

    if (this.Licitaciones===undefined){
      this.idLicitaciones=0;
    }else{
      this.idLicitaciones=this.Licitaciones.length
    }
  }

  GetLicitaciones(){
    this.http.get<any[]>(this.urlFull+'GetValuesJoin/join') 
    .subscribe(Licitacion => {
      this.Licitaciones=Licitacion;
      // Actualizar contratos marco disponibles después de cargar las licitaciones
      this.ContratosMarco = Licitacion.filter(lic => lic.EsContratoMarco === true) || [];
      this.Loading=false;
      this.LoadingTabla[2]=false;
      this.licitacionesCurrentPage = 1; // Reiniciar a la primera página al cargar
    })
  }

  GetHitos(obligatorio:boolean){
    //Hitos
    return this.http.get<any[]>(this.urlBase+'Hitos/GetHitosByObligatoria/Obligatoria='+obligatorio)
  }

  CargaHitos(){
    this.GetHitos(false)
    .subscribe({
      next: (Hito) => {
        let hitosFinal = [...Hito];
        const existeConsultasRev2 = hitosFinal.some(h => h.NombreHito === 'Consultas Rev-2');
        const existeRespuestasRev2 = hitosFinal.some(h => h.NombreHito === 'Respuestas Rev-2');
        if (!existeConsultasRev2) {
          hitosFinal.push({
            IdHitos: 47,
            IdHito: 47,
            NombreHito: 'Consultas Rev-2',
            Obligatorio: false
          });
        }
        if (!existeRespuestasRev2) {
          hitosFinal.push({
            IdHitos: 48,
            IdHito: 48,
            NombreHito: 'Respuestas Rev-2',
            Obligatorio: false
          });
        }
        this.Hitos = hitosFinal;
        if (!this._ordenHitosOriginal || this._ordenHitosOriginal.length === 0) {
          this._ordenHitosOriginal = this.Hitos.map(h => h.IdHito);
        }
      },
      error: () => {
        this.LoadingTabla[0]=false;
      },
      complete: () => {
        this.LoadingTabla[0]=false;
      }
    })

    this.GetHitos(true)
    .subscribe({
      next: (Hito) => {
        this.HitosSelect = Hito.filter(h => h.NombreHito !== 'Consultas Rev-2' && h.NombreHito !== 'Respuestas Rev-2');
      },
      error: () => {
        this.LoadingTabla[1]=false;
      },
      complete: () => {
        this.LoadingTabla[1]=false;
      }
    })
  }

  BuscaEjecutivosPorMandante(_Mandante:number){
    $("#txtNombreEjecutivo").focus();
    // Si el usuario selecciona desde el dropdown, también asigna mandanteSeleccionado
    if (this.Mandantes && _Mandante && _Mandante > 0) {
      const mand = this.Mandantes.find(m => m.IdMandante == _Mandante);
      if (mand) {
        this.mandanteSeleccionado = mand;
      }
    }
    this.http.get<any[]>(this.urlBase+'Ejecutivos/GetEjecutivosByidMandante/idMandante='+_Mandante)
    .subscribe(Ejecutivo => {
      this.Ejecutivos=Ejecutivo;
      this.drdEjecutivos=0;
      // Limpiar error de mandante si se selecciona uno válido
      if (_Mandante && _Mandante > 0) {
        this.error[3] = '';
      }
    })
  }

  BuscaEjecutivosPorMandanteEdit(_Mandante: number, _ejecutivo: number) {
    if (_Mandante && _Mandante > 0) {
      this.LoadingEjecutivos = true;
      this.http.get<any[]>(this.urlBase + 'Ejecutivos/GetEjecutivosByidMandante/idMandante=' + _Mandante)
        .subscribe({
          next: (Ejecutivo) => {
            this.Ejecutivos = Ejecutivo;
            // Si se especifica un ejecutivo, seleccionarlo, de lo contrario reiniciar
            this.drdEjecutivosEdit = _ejecutivo || 0;
            this.LoadingEjecutivos = false;
          },
          error: (error) => {
            console.error('Error cargando ejecutivos:', error);
            this.Ejecutivos = [];
            this.drdEjecutivosEdit = 0;
            this.LoadingEjecutivos = false;
          }
        });
    } else {
      // Si no hay mandante seleccionado, limpiar ejecutivos
      this.Ejecutivos = [];
      this.drdEjecutivosEdit = 0;
      this.LoadingEjecutivos = false;
    }
  }

  ngOnInit() {
    this.drdAreas=0;
    this.drdEjecutivos=0;
    this.drdCompetitividad=0;
    this.drdMandantes=0;
    this.CargarLicitacionesYContratos(); // Cargar ambos tipos en la tabla
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");
  }

  // Nuevo método: Cargar contratos marco disponibles
  GetContratosMarco() {
  this.http.get<any[]>(this.urlBFF+'contrato_m')
    .subscribe({
      next: (data) => {
        this.ContratosMarco = data;
      },
      error: (error) => {
        console.error('Error al cargar contratos marco:', error);
        this.ContratosMarco = [];
      }
    });
    
}

  // Nuevo método: Manejar cambio de tipo de licitación
  onTipoLicitacionChange() {
    if (this.drdTipoLicitacion === 'contrato_marco') {
      this.drdContratoMarco = 0; // Resetear contrato marco padre
    }
  }

  // Nuevo método: Manejar cambio de tipo de licitación en edición
  onTipoLicitacionChangeEdit() {
    if (this.drdTipoLicitacionEdit === 'contrato_marco') {
      this.drdContratoMarcoEdit = 0; // Resetear contrato marco padre
    }
  }

  // Método para notificar cambio de estado (llamado desde tabla-licitaciones)
  notificarCambioEstado(licitacion: any, nuevoEstado: string, estadoAnterior: string) {
    const nombreNuevoEstado = this.Estados.find(e => e.IdEstado == nuevoEstado)?.NombreEstado || 'Desconocido';
    const nombreEstadoAnterior = this.Estados.find(e => e.IdEstado == estadoAnterior)?.NombreEstado || 'Desconocido';
    
    this.notificacionesService.crearNotificacionCambioEstado(
      licitacion, 
      nombreNuevoEstado, 
      nombreEstadoAnterior
    );
  }

  // Método para notificar oferta económica (llamado desde tabla-licitaciones o componente de ofertas)
  notificarOfertaEconomica(licitacion: any, montoOferta: number, empresa: string) {
    this.notificacionesService.crearNotificacionOfertaEconomica(licitacion, montoOferta, empresa);
  }

  // Método para crear contrato marco
  crearContratoMarco() {
    // Payload para contrato marco (ajusta los campos según tu backend)
    const contratoMarcoPayload: any = {
      name: this.txtNombreLicitacion,
      description: this.txtNombreLicitacion,
      filename: this.txtCodigoMan,
      views: 0,
      isPublished: true,
      idArea: Number(this.drdAreas),
      idMandante: Number(this.drdMandantes),
      idEjecutivo: Number(this.drdEjecutivos),
      competitividad: this.drdCompetitividad,
      superficie: this.txtSuperficie ? Number(this.txtSuperficie) : null,
      idEstado: 1,
      fechaCreacion: this.retFecha(this.Hoy),
      idUsuarioCreador: this.usuario.idUsuario,
      fechaRemocion: null,
      idUsuarioRemovedor: null,
      activo: true
    };
    let pag = this.urlBFF + 'contrato_m';
    this.http.post<any>(pag, contratoMarcoPayload)
      .subscribe({
        next: (result) => {
          this.msg = "Contrato marco creado correctamente";
          this.CargarLicitacionesYContratos();
          this.Reset();
        },
        error: (error) => {
          this.msg = "Error al crear el contrato marco";
          this.CargarLicitacionesYContratos();
        }
      });
  }

  Agregar(form: NgForm){
    if (this.drdTipoLicitacion === 'contrato_marco') {
      this.crearContratoMarco();
      return;
    }
    let loc = this;
    
    // Limpiar errores previos antes de validar
    this.Clean();
    
    // Si es licitación normal o hija
    let pag = this.urlBFF + 'licitaciones';
    if (this.Validar(form)) {
      this.Loading = true;
      const licitacionPayload: any = {
        descripcion: this.txtNombreLicitacion,
        numeroPropuesta: this.txtCodigoMan,
        ofertaInicial: this.txtMontoInicial ? String(this.txtMontoInicial) : null,
        competitividad: this.drdCompetitividad,
        superficie: this.txtSuperficie ? Number(this.txtSuperficie) : null,
        idArea: Number(this.drdAreas),
        idMandante: Number(this.drdMandantes),
        idEjecutivo: Number(this.drdEjecutivos),
        idEstado: 1,
        fechaCreacion: this.retFecha(this.Hoy),
        idUsuarioCreador: this.usuario.idUsuario,
        fechaRemocion: null,
        idUsuarioRemovedor: null,
        activo: true,
        tipoLicitacion: 'normal',
        contratoMarco: (this.drdTipoLicitacion === 'normal' && this.drdContratoMarco > 0) ? { id: this.drdContratoMarco } : null,
        esContratoMarco: false
      };
      console.log('POST URL:', pag);
      console.log('Datos enviados:', licitacionPayload);
      this.http.post<any>(pag, licitacionPayload)
        .pipe(
          timeout(10000),
          catchError(err => {
            loc.Loading = false;
            let mensajeError = "Error al crear la licitación. Por favor revisa los campos e inténtalo nuevamente.";
            if (err.name === 'TimeoutError') {
              mensajeError = "El servidor no responde. Intenta nuevamente más tarde.";
            }
            Swal.fire({
              title: 'Error',
              text: mensajeError,
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
            return of(null);
          })
        )
        .subscribe({
          next: (result: any) => {
            loc.Loading = false;
            console.log('Respuesta backend:', result);
            const id = result?.IdLicitacion || result?.idLicitacion || result?.id;
            if (result && id) {
              loc.AgregaHitos(id);
              loc.GetLicitaciones();
              
              // Crear notificación automáticamente al crear una nueva licitación
              const licitacionCreada = {
                IdLicitacion: id,
                NombreLicitacion: loc.txtNombreLicitacion,
                ...licitacionPayload
              };
              loc.notificacionesService.crearNotificacionLicitacion(licitacionCreada);

              Swal.fire({
                title: 'Licitación creada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              }).then(() => {
                window.location.reload();
              });
              
              if (form && typeof form.reset === 'function') {
                form.reset();
              }
              loc.Reset();
              loc.Loading = false;
            }
          },
          error: (err) => {
            loc.Loading = false;
            Swal.fire({
              title: 'Error',
              text: 'Error inesperado al crear la licitación.',
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
          },
          complete: () => {
            loc.Loading = false;
          }
        });
    }
    // Si la validación falla, el mensaje ya se muestra en Validar() con SweetAlert
    // No se necesita mostrar el modal tradicional que bloquea el formulario
  }

  AgregaHitos(_idLicitacion:number){
    let loc = this;
    let pag=this.urlBase+"HitosLicitacion/";
    let hito;
    let count=0;
    let hitosPendientes = this.HitosSelect.length;
    if (hitosPendientes === 0) {
      this.Reset();
      this.CargaHitos();
      this.Loading = false;
      return;
    }
    console.log(this.HitosSelect);
    
    this.HitosSelect.forEach(element => {
      count+=1;
      // Usar IdHito en lugar de IdHitos
      const idHito = element.IdHito || element.IdHitos;
      hito={IdHito:idHito,IdLicitacion:_idLicitacion,Estado:"Pendiente",IdUsuarioCreador:this.usuario.idUsuario,Orden:count};
      const bodyParams = new URLSearchParams();
      bodyParams.set('IdHito', String(hito.IdHito));
      bodyParams.set('IdLicitacion', String(hito.IdLicitacion));
      bodyParams.set('Estado', String(hito.Estado));
      bodyParams.set('IdUsuarioCreador', String(hito.IdUsuarioCreador));
      bodyParams.set('Orden', String(hito.Orden));

      console.log('Enviando hito:', bodyParams.toString());

      this.http.post<any>(pag, bodyParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
      })
      .subscribe({
        next: (result) => {
          hitosPendientes--;
          if (hitosPendientes === 0) {
        this.Reset();
        this.CargaHitos();
        this.Loading = false;
          }
        },
        error: (error) => {
          console.error('Error agregando hito:', error);
          hitosPendientes--;
          if (hitosPendientes === 0) {
        this.Reset();
        this.CargaHitos();
        this.Loading = false;
          }
        }
      });
    });
  }

  Editar(i: number) {
    let loc = this;
    
    // Cargar datos básicos
  this.txtNombreLicitacionEdit = this.Licitaciones[i].descripcion;
    this.txtCodigoManEdit = this.Licitaciones[i].NumeroPropuesta;
    this.txtMontoEdit = this.Licitaciones[i].OfertaInicial;
    this.txtSuperficieEdit = this.Licitaciones[i].Superficie;
    this.drdCompetitividadEdit = this.Licitaciones[i].Competitividad;
    
    // Inicializar dropdowns
    this.drdAreasEdit = 0;
    this.drdMandantesEdit = 0;
    this.drdEjecutivosEdit = 0;
    
    // Cargar área
    if (this.Licitaciones[i].NombreArea) {
      let pag = this.urlBase + 'Area/GetAreaByNombreArea/NombreArea=' + this.Licitaciones[i].NombreArea;
      this.http.get<any[]>(pag).subscribe({
        next: (Area) => {
          if (Area && Area.length > 0) {
            loc.drdAreasEdit = Area[0].IdArea;
          }
        },
        error: (error) => {
          console.error('Error cargando área:', error);
        }
      });
    }
    
    // Cargar mandante y ejecutivo
    if (this.Licitaciones[i].NombreMandante) {
      let pag2 = this.urlBase + 'Mandante/GetMandanteByNombreMandante/NombreMandante=' + this.Licitaciones[i].NombreMandante;
      this.http.get<any[]>(pag2).subscribe({
        next: (Mandante) => {
          if (Mandante && Mandante.length > 0) {
            loc.drdMandantesEdit = Mandante[0].IdMandante;
            
            // Cargar ejecutivos del mandante y seleccionar el ejecutivo actual
            if (this.Licitaciones[i].NombreEjecutivo) {
              let pag3 = this.urlBase + 'Ejecutivos/GetEjecutivosByNombreEjecutivo/NombreEjecutivo=' + this.Licitaciones[i].NombreEjecutivo;
              this.http.get<any[]>(pag3).subscribe({
                next: (Ejecutivo) => {
                  if (Ejecutivo && Ejecutivo.length > 0) {
                    // Cargar todos los ejecutivos del mandante y seleccionar el actual
                    loc.BuscaEjecutivosPorMandanteEdit(Mandante[0].IdMandante, Ejecutivo[0].IdEjecutivos);
                  } else {
                    // Si no se encuentra el ejecutivo, cargar todos los ejecutivos del mandante
                    loc.BuscaEjecutivosPorMandanteEdit(Mandante[0].IdMandante, 0);
                  }
                },
                error: (error) => {
                  console.error('Error cargando ejecutivo:', error);
                  // En caso de error, cargar todos los ejecutivos del mandante
                  loc.BuscaEjecutivosPorMandanteEdit(Mandante[0].IdMandante, 0);
                }
              });
            } else {
              // Si no hay ejecutivo específico, cargar todos los ejecutivos del mandante
              loc.BuscaEjecutivosPorMandanteEdit(Mandante[0].IdMandante, 0);
            }
          }
        },
        error: (error) => {
          console.error('Error cargando mandante:', error);
        }
      });
    }
    
    // Cargar campos de contrato marco
    this.drdTipoLicitacionEdit = this.Licitaciones[i].TipoLicitacion || 'normal';
    this.drdContratoMarcoEdit = this.Licitaciones[i].IdContratoMarco || 0;
    
    this.IndexUpdate = i;
    this.VerPopUp();
  }

  // Método para editar contrato marco
  editarContratoMarco(id: number) {
    const contratoMarcoObj = {
      id: id,
      name: this.txtNombreLicitacionEdit,
      description: this.txtNombreLicitacionEdit,
      filename: this.txtCodigoManEdit,
      views: this.txtMontoEdit,
      isPublished: true
      // Agrega otros campos si tu entidad Contrato_M los requiere
    };
    this.http.post<any>(`${environment.urlBFF}contrato_m/${id}`, contratoMarcoObj)
      .subscribe({
        next: (result) => {
          this.msg = "Contrato marco actualizado correctamente";
          this.CargarLicitacionesYContratos();
          this.OcultarPopUp();
        },
        error: (error) => {
          this.msg = "Error al actualizar el contrato marco";
        }
      });
  }

  Actualizar(form: NgForm){
    if (this.drdTipoLicitacionEdit === 'contrato_marco') {
      this.editarContratoMarco(this.drdContratoMarcoEdit);
    } else {
      let loc = this;
      this.Loading = true;
      let pag = this.urlFull + this.Licitaciones[this.IndexUpdate].IdLicitacion;
      // Actualizar los datos del objeto
      this.Licitaciones[this.IndexUpdate].IdArea = this.drdAreasEdit;
  this.Licitaciones[this.IndexUpdate].descripcion = this.txtNombreLicitacionEdit;
      this.Licitaciones[this.IndexUpdate].NumeroPropuesta = this.txtCodigoManEdit;
      this.Licitaciones[this.IndexUpdate].OfertaInicial = this.txtMontoEdit;
      this.Licitaciones[this.IndexUpdate].IdMandante = this.drdMandantesEdit;
      this.Licitaciones[this.IndexUpdate].IdEjecutivos = this.drdEjecutivosEdit; // Corregido el nombre de la propiedad
      this.Licitaciones[this.IndexUpdate].Superficie = this.txtSuperficieEdit;
      this.Licitaciones[this.IndexUpdate].Competitividad = this.drdCompetitividadEdit;
      // Actualizar campos de contrato marco
      this.Licitaciones[this.IndexUpdate].TipoLicitacion = this.drdTipoLicitacionEdit;
      this.Licitaciones[this.IndexUpdate].IdContratoMarco = this.drdContratoMarcoEdit > 0 ? this.drdContratoMarcoEdit : null;
      this.Licitaciones[this.IndexUpdate].EsContratoMarco = this.drdTipoLicitacionEdit === 'contrato_marco';
      console.log('Actualizando licitación:', this.Licitaciones[this.IndexUpdate]);
      // Enviar al servidor
      this.http.post<any>(pag, this.Licitaciones[this.IndexUpdate])
        .subscribe({
          next: (result) => {
            loc.Loading = false;
            loc.msg = "Licitación actualizada correctamente";
            loc.Mensaje();
            // Recargar la lista para mostrar los datos actualizados con nombres completos
            loc.CargarLicitacionesYContratos();
            form.reset();
            loc.OcultarPopUp();
          },
          error: (error) => {
            console.error('Error al actualizar licitación:', error);
            loc.Loading = false;
            loc.msg = "Error al actualizar la licitación";
            loc.Mensaje();
            // Recargar la lista original en caso de error
            loc.CargarLicitacionesYContratos();
          }
        });
    }
  }

  Eliminar(){
    this.Loading=true;
    let loc = this;
    let licitacion:Licitaciones;
    let pag=this.urlFull+this.Licitaciones[this.IndexEliminar].IdLicitacion;

    licitacion=this.Licitaciones[this.IndexEliminar];
    licitacion.IdUsuarioRemovedor=this.usuario.idUsuario;

    this.http.post<any>(pag, licitacion)
      .subscribe({
        next: (result) => {
          loc.GetLicitaciones();
          loc.msg="Se ha eliminado el elemento";
          loc.Mensaje();
        },
        error: (error) => {
          loc.GetLicitaciones();
          $("#IcoMensaje").attr('class','fa fa-info-circle');
          $("#IcoMensaje").attr('style','color:#ffc800;position: relative;top: -15px;left: 5px;');
          loc.msg="Error al tratar de eliminar el elemento";//glyphicon glyphicon-warning-sign
          loc.Mensaje();
        }
      });
    
    $("#drdAreas").focus();
    this.OcultarConfirmacion();
  }

  AgregarHito(i: number){
  // Usar el getter para mantener el orden visual
  var HitoSelect: Hitos = this.HitosOrdenados[i];
  // Buscar el índice real en el array Hitos
  const realIndex = this.Hitos.findIndex(h => h.IdHito === HitoSelect.IdHito);
    // Verificar que el hito no esté ya agregado
    if (this.HitosSelect && this.HitosSelect.some(h => h.IdHito === HitoSelect.IdHito)) {
      return; // Ya está agregado
    }
    if (this.HitosSelect === undefined){
      this.HitosSelect = [HitoSelect];
    } else {
      // Insertar al final (o puedes mantener la lógica de orden si lo deseas)
      this.HitosSelect.push(HitoSelect);
    }
    if (realIndex !== -1) {
      this.Hitos.splice(realIndex, 1);
    }
    // Opcional: mostrar mensaje de confirmación
    console.log('Hito agregado:', HitoSelect.NombreHito);
  }

  EliminarHito(i: number){
    var HitoDeselect: Hitos = this.HitosSelect[i];
    // Verificar que no sea un hito obligatorio
    if (HitoDeselect.Obligatorio) {
      return; // No se puede eliminar hitos obligatorios
    }
    if (this.Hitos === undefined){
      this.Hitos = [HitoDeselect];
    } else {
      // Insertar en la posición original
      if (!this._ordenHitosOriginal) {
        this._ordenHitosOriginal = [...this.Hitos, ...this.HitosSelect].map(h => h.IdHito);
      }
      let pos = this._ordenHitosOriginal.indexOf(HitoDeselect.IdHito);
      if (pos === -1 || pos > this.Hitos.length) {
        this.Hitos.push(HitoDeselect);
      } else {
        this.Hitos.splice(pos, 0, HitoDeselect);
      }
    }
    this.HitosSelect.splice(i, 1);
    // Opcional: mostrar mensaje de confirmación
    console.log('Hito eliminado:', HitoDeselect.NombreHito);
  }

  Reset(){
    this.txtNombreLicitacion="";
    this.txtCodigoMan="";
    this.drdMandantes="";
    this.txtMonto="";
    this.txtSuperficie="";
    this.drdCompetitividad="";
    this.drdAreas="";
    this.drdEjecutivos="";
    
    // Limpiar hitos seleccionados
    this.HitosSelect = [];
    
    // Limpiar campos de búsqueda de mandantes
    this.txtBuscarMandante = "";
    this.mandanteSeleccionado = null;
    this.mandantesFiltrados = this.Mandantes || [];
    this.mostrarListaMandantes = false;
  }

  retFecha(now){
    var dd = now.getDate();
    var mm = now.getMonth() + 1; // January is 0!
    var yyyy = now.getFullYear();

    // Asegura dos dígitos
    var ddStr = dd < 10 ? '0' + dd : '' + dd;
    var mmStr = mm < 10 ? '0' + mm : '' + mm;

    // Devuelve en formato YYYY-MM-DD
    return `${yyyy}-${mmStr}-${ddStr}`;
  }

  VerPopUp(){
    // Mostrar modal usando Bootstrap
    const modal = document.getElementById('exampleModalLong');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      
      // Crear backdrop si no existe
      if (!document.querySelector('.modal-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
    }
    
    // Fallback para jQuery si está disponible
    if (typeof $ !== 'undefined') {
      $("#exampleModalLong").attr('class', 'modal fade show');
      $("#exampleModalLong").attr("style", "display: block;");
      $("body").attr("style", "overflow-y: hidden;");
    }
  }

  OcultarPopUp(){
    // Ocultar modal usando Bootstrap
    const modal = document.getElementById('exampleModalLong');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      
      // Remover backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
    
    // Fallback para jQuery si está disponible
    if (typeof $ !== 'undefined') {
      $("#exampleModalLong").attr('class', 'modal fade');
      $("#exampleModalLong").attr("style", "");
      $("body").attr("style", "");
    }
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
    let bol:boolean=true;
    let camposFaltantes: string[] = [];
    
    if (this.txtNombreLicitacion=="" || this.txtNombreLicitacion===undefined){
      $("#txtNombreLicitacion").attr("class","form-control error");
      this.error[0]="Debe ingresar valor";
      camposFaltantes.push("Nombre Licitación");
      bol=false;
    }
    if (this.drdCompetitividad==0 || this.drdCompetitividad==""){
      $("#drdCompetitividad").attr("class","form-control error");
      this.error[1]="Debe seleccionar la competitividad";
      camposFaltantes.push("Competitividad");
      bol=false;
    }
    if (this.drdAreas==0){
      $("#drdAreas").attr("class","form-control error");
      this.error[2]="Debe seleccionar un área";
      camposFaltantes.push("Área");
      bol=false;
    }
    if (this.drdMandantes==0){
      $("#drdMandantes").attr("class","form-control error");
      this.error[3]="Debe seleccionar un mandante";
      camposFaltantes.push("Mandante");
      bol=false;
    }
    if (this.drdEjecutivos==0){
      $("#drdEjecutivos").attr("class","form-control error");
      this.error[4]="Debe seleccionar un ejecutivo";
      camposFaltantes.push("Ejecutivo");
      bol=false;
    }
    
    // Si hay errores, mostrar un mensaje claro sin bloquear el formulario
    if (!bol && camposFaltantes.length > 0) {
      Swal.fire({
        title: 'Campos incompletos',
        html: `Por favor complete los siguientes campos obligatorios:<br><br><strong>${camposFaltantes.join('<br>')}</strong>`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f48826'
      });
    }
    
    return bol
  }

  Clean(){
    $("#txtNombreLicitacion").attr("class","form-control");
    $("#drdCompetitividad").attr("class","form-control");
    $("#drdAreas").attr("class","form-control");
    $("#drdMandantes").attr("class","form-control");
    $("#txtBuscarMandante").attr("class","form-control");
    $("#drdEjecutivos").attr("class","form-control");
    this.error=[];
  }

  // Métodos para búsqueda de Mandantes
  filtrarMandantes() {
    const busqueda = this.txtBuscarMandante.toLowerCase();
    this.mandantesFiltrados = this.Mandantes.filter(mandante => 
      mandante.NombreMandante.toLowerCase().includes(busqueda)
    );
    this.mostrarListaMandantes = true;
  }

  seleccionarMandante(mandante: Mandante) {
    this.mandanteSeleccionado = mandante;
    this.txtBuscarMandante = mandante.NombreMandante;
    this.drdMandantes = mandante.IdMandante;
    this.mostrarListaMandantes = false;
    
    // Buscar ejecutivos por mandante seleccionado
    this.BuscaEjecutivosPorMandante(mandante.IdMandante);
    
    // Limpiar errores
    this.Clean();
  }

  ocultarListaMandantes() {
    setTimeout(() => {
      this.mostrarListaMandantes = false;
    }, 200);
  }

  formatMonto(monto: any): string {
    const num = Number(monto);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  mostrarConfirmacionEliminar(index: number) {
    this.IndexEliminar = index;
    if (typeof $ !== 'undefined') {
      $('#Confirm').modal('show');
    }
  }
}
