import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MainComponent } from '../../main/main.component';
import { environment } from '../../../environments/environment';

declare var Swal: any;

@Component({
  selector: 'app-editar-licitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent],
  templateUrl: './editar-licitaciones.component.html',
  styleUrls: ['./editar-licitaciones.component.css']
})
export class EditarLicitacionesComponent implements OnInit {
  Mandantes: any[] = [];
  Ejecutivos: any[] = [];

  private normalizeEjecutivos(ejecutivos: any[]): any[] {
    if (!Array.isArray(ejecutivos)) return [];
    return ejecutivos
      .map((e) => {
        const id = Number(e?.IdEjecutivo ?? e?.idEjecutivo ?? e?.IdEjecutivos ?? e?.idejecutivo ?? 0);
        const nombre = e?.NombreEjecutivo ?? e?.nombreEjecutivo ?? e?.Nombre ?? e?.nombre ?? '';
        return {
          ...e,
          IdEjecutivo: Number.isFinite(id) ? id : 0,
          NombreEjecutivo: nombre,
        };
      })
      .filter(e => Number(e.IdEjecutivo) > 0);
  }

  getNombreArea(id: any): string {
    const area = this.Areas.find(a => String(a.IdArea || a.idArea) === String(id));
    return area ? (area.NombreArea || area.nombreArea) : '';
  }
  getNombreMandante(id: any): string {
    const mandante = this.Mandantes.find(m => String(m.IdMandante || m.idMandante) === String(id));
    return mandante ? (mandante.NombreMandante || mandante.nombreMandante) : '';
  }
  getNombreEjecutivo(id: any): string {
    if (!id || !this.Ejecutivos || !this.Ejecutivos.length) return '';
    const ejecutivo = this.Ejecutivos.find(e =>
      String(e.IdEjecutivo ?? e.idEjecutivo ?? e.IdEjecutivos ?? e.idejecutivo) === String(id)
    );
    return ejecutivo
      ? (ejecutivo.NombreEjecutivo ?? ejecutivo.nombreEjecutivo ?? ejecutivo.Nombre ?? ejecutivo.nombre ?? 'Sin responsable')
      : 'Sin responsable';
  }

  EditarHija(hija: any, contratoMarco: any) {
    this.editLicitacion = { ...hija };
    this.showEditModal = true;
  }

  EliminarHija(hija: any, contratoMarco: any) {
    if (!hija || !hija.IdLicitacion) return;

    const nombreHija = hija.Descripcion || hija.NombreLicitacion || 'Sin nombre';
    const nombrePadre = contratoMarco.Descripcion || contratoMarco.NombreLicitacion || 'Sin nombre';

    Swal.fire({
      title: '¿Estás seguro de eliminar esta licitación?',
      text: `Se eliminará la licitación hija "${nombreHija}" del contrato marco "${nombrePadre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result: any) => {
      if (!result.isConfirmed) return;

      this.Loading = true;
      this.http.delete<any>(environment.urlBFF + 'licitaciones/' + hija.IdLicitacion)
        .subscribe({
          next: () => {
            if (contratoMarco.licitaciones && Array.isArray(contratoMarco.licitaciones)) {
              const index = contratoMarco.licitaciones.findIndex(l => l.IdLicitacion === hija.IdLicitacion);
              if (index !== -1) {
                contratoMarco.licitaciones.splice(index, 1);
              }
            }
            this.CargarLicitacionesYContratos();
            this.Loading = false;
            Swal.fire({
              title: 'Licitación eliminada correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          error: (error) => {
            console.error('Error al eliminar licitación hija:', error);
            this.CargarLicitacionesYContratos();
            this.Loading = false;

            let errorMsg = 'Error al eliminar la licitación hija';
            if (error.status === 404) {
              errorMsg = 'La licitación hija no fue encontrada';
            } else if (error.status === 403) {
              errorMsg = 'No tiene permisos para eliminar esta licitación';
            } else if (error.status >= 500) {
              errorMsg = 'Error interno del servidor';
            }
            Swal.fire({
              title: errorMsg,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
    });
  }

  eliminarContratoMarcoConHijas(contratoMarco: any) {
    if (!contratoMarco || !contratoMarco.IdLicitacion) return;
    const hijas = this.getHijasContratoMarco(contratoMarco);
    Swal.fire({
      title: '¿Estás seguro de eliminar este contrato marco?',
      text: 'Se eliminarán todas sus licitaciones hijas. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result: any) => {
      if (!result.isConfirmed) return;

      this.Loading = true;
      const eliminarHijasYHitos = (index: number) => {
        if (index >= hijas.length) {
          this.http.delete<any>(environment.urlBFF + 'contrato_m/' + contratoMarco.IdLicitacion)
            .subscribe({
              next: () => {
                this.CargarLicitacionesYContratos();
                this.Loading = false;
                Swal.fire({
                  title: 'Contrato marco eliminado correctamente',
                  icon: 'success',
                  confirmButtonText: 'Aceptar'
                });
              },
              error: () => {
                this.CargarLicitacionesYContratos();
                this.Loading = false;
                Swal.fire({
                  title: 'Error al eliminar el contrato marco',
                  icon: 'error',
                  confirmButtonText: 'Aceptar'
                });
              }
            });
          return;
        }
        const hija = hijas[index];
        this.http.delete<any>(environment.urlBase + 'HitosLicitacion/DeleteByLicitacion/idLicitacion=' + (hija.IdLicitacion || hija.idLicitacion))
          .subscribe({
            next: () => {
              this.http.delete<any>(environment.urlBFF + 'licitaciones/' + (hija.IdLicitacion || hija.idLicitacion))
                .subscribe({
                  next: () => eliminarHijasYHitos(index + 1),
                  error: () => eliminarHijasYHitos(index + 1)
                });
            },
            error: () => {
              this.http.delete<any>(environment.urlBFF + 'licitaciones/' + (hija.IdLicitacion || hija.idLicitacion))
                .subscribe({
                  next: () => eliminarHijasYHitos(index + 1),
                  error: () => eliminarHijasYHitos(index + 1)
                });
            }
          });
      };
      eliminarHijasYHitos(0);
    });
  }

  getHijasContratoMarco(contratoMarco: any): any[] {
    if (!contratoMarco) return [];
    const id = String(contratoMarco.IdLicitacion || contratoMarco.id);
    if (Array.isArray(contratoMarco.licitaciones)) {
      return contratoMarco.licitaciones.map(l => ({
        ...l,
        IdContratoMarco: id,
        IdLicitacion: l.IdLicitacion || l.idLicitacion,
        NombreLicitacion: l.NombreLicitacion || l.nombreLicitacion || '',
        Descripcion: l.Descripcion || l.descripcion || '',
        NumeroPropuesta: l.NumeroPropuesta || l.numeroPropuesta || '',
        OfertaInicial: l.OfertaInicial || l.ofertaInicial || '',
        Monto: l.Monto || l.monto || '',
        CodigoMandante: l.CodigoMandante || l.codigoMandante || '',
        IdArea: l.IdArea || l.idArea || '',
        NombreArea: l.NombreArea || l.nombreArea || '',
        IdMandante: l.IdMandante || l.idMandante || '',
        NombreMandante: l.NombreMandante || l.nombreMandante || '',
        IdEjecutivo: l.IdEjecutivo || l.idEjecutivo || '',
        NombreEjecutivo: l.NombreEjecutivo || l.nombreEjecutivo || '',
        idEstado: l.idEstado || l.IdEstado || '',
        Estado: l.Estado || l.estado || '',
        Competitividad: l.Competitividad || l.competitividad || '',
        FechaCreacion: l.FechaCreacion || l.fechaCreacion || '',
        FechaOferta: l.FechaOferta || l.fechaOferta || '',
        Superficie: l.Superficie || l.superficie || '',
        Activo: l.Activo !== undefined ? l.Activo : true,
        TipoLicitacion: l.TipoLicitacion || l.tipoLicitacion || '',
        EsContratoMarco: l.EsContratoMarco !== undefined ? l.EsContratoMarco : false,
        isPublished: l.isPublished !== undefined ? l.isPublished : false
      }));
    }
    return this.Licitaciones.filter(l => l.IdContratoMarco && (String(l.IdContratoMarco) === id)).map(l => ({
      ...l,
      IdLicitacion: l.IdLicitacion || l.idLicitacion,
      NombreLicitacion: l.NombreLicitacion || l.nombreLicitacion || '',
      Descripcion: l.Descripcion || l.descripcion || '',
      NumeroPropuesta: l.NumeroPropuesta || l.numeroPropuesta || '',
      OfertaInicial: l.OfertaInicial || l.ofertaInicial || '',
      Monto: l.Monto || l.monto || '',
      CodigoMandante: l.CodigoMandante || l.codigoMandante || '',
      IdArea: l.IdArea || l.idArea || '',
      NombreArea: l.NombreArea || l.nombreArea || '',
      IdMandante: l.IdMandante || l.idMandante || '',
      NombreMandante: l.NombreMandante || l.nombreMandante || '',
      IdEjecutivo: l.IdEjecutivo || l.idEjecutivo || '',
      NombreEjecutivo: l.NombreEjecutivo || l.nombreEjecutivo || '',
      idEstado: l.idEstado || l.IdEstado || '',
      Estado: l.Estado || l.estado || '',
      Competitividad: l.Competitividad || l.competitividad || '',
      FechaCreacion: l.FechaCreacion || l.fechaCreacion || '',
      FechaOferta: l.FechaOferta || l.fechaOferta || '',
      Superficie: l.Superficie || l.superficie || '',
      Activo: l.Activo !== undefined ? l.Activo : true,
      TipoLicitacion: l.TipoLicitacion || l.tipoLicitacion || '',
      EsContratoMarco: l.EsContratoMarco !== undefined ? l.EsContratoMarco : false,
      isPublished: l.isPublished !== undefined ? l.isPublished : false
    }));
  }

  loadingFiltro: boolean = false;
  suggestionIndex: number = -1;

  clearFiltro() {
    this.filtroNombre = '';
    this.showSuggestions = false;
    this.suggestionIndex = -1;
  }

  onInput(event: any) {
    this.loadingFiltro = true;
    this.showSuggestions = true;
    this.suggestionIndex = -1;
    setTimeout(() => {
      this.loadingFiltro = false;
    }, 350);
  }

  onKeyDown(event: KeyboardEvent) {
    const suggestions = this.licitacionesFiltradas.slice(0, 8);
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.suggestionIndex = (this.suggestionIndex + 1) % suggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.suggestionIndex = (this.suggestionIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === 'Enter' && this.suggestionIndex >= 0) {
      event.preventDefault();
      this.selectSuggestion(suggestions[this.suggestionIndex]);
    }
  }

  selectSuggestion(l: any) {
    this.filtroNombre = l.Descripcion;
    this.showSuggestions = false;
    this.suggestionIndex = -1;
  }

  showSuggestions: boolean = false;
  filtroNombre: string = '';
  showEditModal = false;
  editLicitacion = null;
  Licitaciones: any[] = [];
  ContratosMarco: any[] = [];
  Areas: any[] = [];
  licitacionesPageSize: number = 30;
  licitacionesCurrentPage: number = 1;
  Loading: boolean = false;
  LoadingTabla: boolean[] = [true, true, true];
  urlBase: string = environment.urlBFF;
  controlador: string = 'licitaciones/';
  urlFull: string = this.urlBase + this.controlador;
  IndexUpdate: number | null = null;
  IndexEliminar: number | null = null;
  msg: string = '';

  // Propiedades para selección de licitaciones hijas
  licitacionesHijasSeleccionadas: Set<number> = new Set();
  modoSeleccion: boolean = false;
  contratoMarcoEnSeleccion: any = null;
  hijasSeleccionadas: { [key: number]: boolean } = {};

  constructor(private http: HttpClient) {}

  trackByHijaId(index: number, hija: any): number {
    return hija.IdLicitacion || hija.idLicitacion;
  }

  hideSuggestions() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  ngOnInit() {
    this.CargarLicitacionesYContratos();
    this.CargarAreas();
    this.CargarMandantes();
    this.CargarTodosEjecutivos();
  }

  CargarTodosEjecutivos() {
    this.http.get<any[]>("http://trazas-nbi.com:1234/api/Ejecutivos/")
      .subscribe({
        next: (ejecutivos) => {
          this.Ejecutivos = this.normalizeEjecutivos(ejecutivos);
        },
        error: () => {
          this.Ejecutivos = [];
        }
      });
  }

  CargarMandantes() {
    this.http.get<any[]>('http://trazas-nbi.com:1234/api/Mandante/')
      .subscribe({
        next: (mandantes) => {
          this.Mandantes = mandantes;
        },
        error: () => {
          this.Mandantes = [];
        }
      });
  }

  CargarEjecutivos() {
    this.http.get<any[]>('http://trazas-nbi.com:1234/api/Ejecutivo/')
      .subscribe({
        next: (ejecutivos) => {
          this.Ejecutivos = this.normalizeEjecutivos(ejecutivos);
        },
        error: () => {
          this.Ejecutivos = [];
        }
      });
  }

  CargarAreas() {
    this.http.get<any[]>('http://trazas-nbi.com:1234/api/Area/')
      .subscribe({
        next: (areas) => {
          this.Areas = areas;
        },
        error: (err) => {
          this.Areas = [];
        }
      });
  }

  CargarLicitacionesYContratos() {
    this.Loading = true;
    this.LoadingTabla[2] = true;
    this.http.get<any[]>(environment.urlBFF + 'licitaciones')
      .subscribe(licitacionesRaw => {
        const licitaciones = licitacionesRaw.map(l => {
          let idEjecutivo = '';
          if (
            l.idEjecutivo !== undefined &&
            l.idEjecutivo !== null &&
            l.idEjecutivo !== '' &&
            l.idEjecutivo !== 'undefined' &&
            !isNaN(Number(l.idEjecutivo)) &&
            Number(l.idEjecutivo) > 0
          ) {
            idEjecutivo = String(Number(l.idEjecutivo));
          }
          return {
            IdLicitacion: Number(l.idLicitacion),
            Descripcion: l.descripcion || '',
            NumeroPropuesta: l.numeroPropuesta || '',
            OfertaInicial: l.ofertaInicial || 0,
            Competitividad: l.competitividad || '',
            Superficie: l.superficie || 0,
            IdArea: l.idArea ? Number(l.idArea) : 0,
            NombreArea: l.nombreArea || '',
            IdMandante: l.idMandante ? Number(l.idMandante) : 0,
            NombreMandante: l.nombreMandante || '',
            IdEjecutivo: idEjecutivo,
            NombreEjecutivo: l.nombreEjecutivo || '',
            idEstado: l.idEstado ? Number(l.idEstado) : 0,
            Estado: l.estado || '',
            FechaCreacion: l.fechaCreacion || '',
            Activo: l.activo !== undefined ? l.activo : true,
            IdContratoMarco: l.idContratoMarco ? Number(l.idContratoMarco) : null,
            EsContratoMarco: false
          };
        });

        this.http.get<any[]>(environment.urlBFF + 'contrato_m')
          .subscribe(contratos => {
            const contratosFormateados = contratos.map(c => ({
              IdLicitacion: c.id,
              NombreLicitacion: c.name,
              Descripcion: c.description || c.name,
              NumeroPropuesta: c.filename,
              OfertaInicial: c.views,
              Monto: c.views,
              CodigoMandante: c.codigoMandante || '',
              IdArea: c.idArea || 0,
              NombreArea: c.nombreArea || '',
              IdMandante: c.idMandante || 0,
              NombreMandante: c.nombreMandante || '',
              IdEjecutivo: c.idEjecutivo || 0,
              NombreEjecutivo: c.nombreEjecutivo || '',
              idEstado: c.idEstado || 0,
              Estado: c.estado || '',
              Competitividad: c.competitividad || '',
              FechaCreacion: c.fechaCreacion || '',
              FechaOferta: c.fechaOferta || '',
              Superficie: c.superficie || 0,
              Activo: c.activo !== undefined ? c.activo : true,
              TipoLicitacion: 'contrato_marco',
              IdContratoMarco: null,
              EsContratoMarco: true,
              isPublished: c.isPublished,
              licitaciones: c.licitaciones
            }));
            this.Licitaciones = [...licitaciones, ...contratosFormateados];
            this.eliminarLicitacionesDuplicadas();

            this.Licitaciones.sort((a, b) => {
              const fechaA = new Date(a.FechaCreacion || 0).getTime();
              const fechaB = new Date(b.FechaCreacion || 0).getTime();
              return fechaB - fechaA;
            });

            this.ContratosMarco = contratos;
            this.Loading = false;
            this.LoadingTabla[2] = false;
            this.licitacionesCurrentPage = 1;
          });
      });
  }

  get licitacionesFiltradas(): any[] {
    if (!this.filtroNombre || this.filtroNombre.trim() === '') {
      return this.Licitaciones;
    }
    const filtro = this.filtroNombre.toLowerCase();
    return this.Licitaciones.filter(l =>
      (l.Descripcion || '').toLowerCase().includes(filtro) ||
      (l.NombreLicitacion || '').toLowerCase().includes(filtro)
    );
  }

  get licitacionesTotalPages(): number {
    return Math.ceil((this.licitacionesFiltradas?.length || 0) / this.licitacionesPageSize);
  }

  get pagedLicitaciones(): any[] {
    const start = (this.licitacionesCurrentPage - 1) * this.licitacionesPageSize;
    return this.licitacionesFiltradas?.slice(start, start + this.licitacionesPageSize) || [];
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

  // ✅ FIX: Recibe el objeto licitación directamente en lugar del índice de la página
  Editar(licitacion: any) {
    this.IndexUpdate = this.Licitaciones.findIndex(
      l => l.IdLicitacion === licitacion.IdLicitacion
    );

    const lic = { ...licitacion };
    lic.IdArea = lic.IdArea ? Number(lic.IdArea) : 0;
    lic.IdMandante = lic.IdMandante ? Number(lic.IdMandante) : 0;

    if (
      lic.IdEjecutivo === undefined ||
      lic.IdEjecutivo === null ||
      lic.IdEjecutivo === '' ||
      lic.IdEjecutivo === 'undefined' ||
      isNaN(Number(lic.IdEjecutivo)) ||
      Number(lic.IdEjecutivo) <= 0
    ) {
      if (lic.NombreEjecutivo) {
        const normalizar = (str: string) => (str || '').toLowerCase().replace(/\s+/g, '');
        const nombreLic = normalizar(lic.NombreEjecutivo);
        const encontrado = this.Ejecutivos.find(e => normalizar(e.NombreEjecutivo) === nombreLic);
        lic.IdEjecutivo = encontrado ? Number(encontrado.IdEjecutivo) : 0;
        lic.NombreEjecutivo = encontrado ? encontrado.NombreEjecutivo : '';
      } else {
        lic.IdEjecutivo = 0;
        lic.NombreEjecutivo = '';
      }
    } else {
      lic.IdEjecutivo = Number(lic.IdEjecutivo);
      const encontrado = this.Ejecutivos.find(e => Number(e.IdEjecutivo) === lic.IdEjecutivo);
      lic.NombreEjecutivo = encontrado ? encontrado.NombreEjecutivo : '';
    }

    this.editLicitacion = lic;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editLicitacion = null;
  }

  guardarEdicion() {
    if (this.IndexUpdate === null || !this.editLicitacion) return;
    const lic = this.editLicitacion;

    const areaValido = Number(lic.IdArea) > 0;
    const mandanteValido = Number(lic.IdMandante) > 0;
    const ejecutivoValido = Number(lic.IdEjecutivo) > 0 && !isNaN(Number(lic.IdEjecutivo));
    if (!areaValido || !mandanteValido || !ejecutivoValido) {
      console.warn('Valores recibidos:', {
        IdArea: lic.IdArea,
        IdMandante: lic.IdMandante,
        IdEjecutivo: lic.IdEjecutivo
      });
      alert('Debes seleccionar Área, Mandante y Responsable válidos antes de guardar.');
      return;
    }

    const url = environment.urlBFF + 'licitaciones/' + lic.IdLicitacion;
    this.Loading = true;

    this.http.get<any>(url).subscribe({
      next: (current) => {
        const payload: any = { ...(current || {}) };

        payload.descripcion = lic.Descripcion;
        payload.numeroPropuesta = lic.NumeroPropuesta;
        payload.ofertaInicial = Number(lic.OfertaInicial ?? payload.ofertaInicial ?? 0);
        payload.competitividad = lic.Competitividad;
        payload.superficie = Number(lic.Superficie ?? payload.superficie ?? 0);
        payload.idArea = Number(lic.IdArea);
        payload.idMandante = Number(lic.IdMandante);
        payload.idEjecutivo = Number(lic.IdEjecutivo);
        payload.idEstado = Number(lic.idEstado ?? payload.idEstado ?? 0);

        if (payload.fechaRemocion === '') payload.fechaRemocion = null;
        if (payload.fechaRemocion) {
          const fecha = new Date(payload.fechaRemocion);
          payload.fechaRemocion = isNaN(fecha.getTime()) ? null : fecha.toISOString();
        }

        delete payload.idLicitacion;
        delete payload.IdLicitacion;

        console.log('Objeto enviado al backend (PUT licitacion):', payload);
        this.http.put<any>(url, payload).subscribe({
          next: () => {
            this.CargarLicitacionesYContratos();
            this.Loading = false;
            this.closeEditModal();
            alert('Licitación editada correctamente');
          },
          error: (err) => {
            console.error('Error al editar:', err);
            this.Loading = false;
            alert('Error al editar la licitación');
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener licitación antes de editar:', err);
        this.Loading = false;
        alert('No se pudo obtener la licitación para editar');
      }
    });
  }

  Confirmacion(i: number) {
    this.IndexEliminar = i;
    Swal.fire({
      title: '¿Estás seguro de eliminar esta licitación?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.Eliminar();
      }
    });
  }

  Eliminar() {
    if (this.IndexEliminar === null) return;
    const licitacion = this.Licitaciones[this.IndexEliminar];
    const url = environment.urlBFF + 'licitaciones/' + licitacion.IdLicitacion;
    this.Loading = true;
    this.http.delete<any>(url)
      .subscribe({
        next: () => {
          this.CargarLicitacionesYContratos();
          this.Loading = false;
          Swal.fire({
            title: 'Licitación eliminada correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this.CargarLicitacionesYContratos();
          this.Loading = false;
          Swal.fire({
            title: 'Error al eliminar la licitación',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }

  activarModoSeleccion(contratoMarco: any) {
    this.modoSeleccion = true;
    this.contratoMarcoEnSeleccion = contratoMarco;
    this.licitacionesHijasSeleccionadas.clear();
    this.hijasSeleccionadas = {};
  }

  cancelarSeleccion() {
    this.modoSeleccion = false;
    this.contratoMarcoEnSeleccion = null;
    this.licitacionesHijasSeleccionadas.clear();
    this.hijasSeleccionadas = {};
  }

  toggleSeleccionHija(hija: any) {
    const id = hija.IdLicitacion || hija.idLicitacion;
    if (this.licitacionesHijasSeleccionadas.has(id)) {
      this.licitacionesHijasSeleccionadas.delete(id);
      this.hijasSeleccionadas[id] = false;
    } else {
      this.licitacionesHijasSeleccionadas.add(id);
      this.hijasSeleccionadas[id] = true;
    }
  }

  isHijaSeleccionada(hija: any): boolean {
    const id = hija.IdLicitacion || hija.idLicitacion;
    return this.licitacionesHijasSeleccionadas.has(id) || !!this.hijasSeleccionadas[id];
  }

  seleccionarTodasLasHijas(contratoMarco: any) {
    const hijas = this.getHijasContratoMarco(contratoMarco);
    hijas.forEach(hija => {
      const id = hija.IdLicitacion || hija.idLicitacion;
      if (id) {
        this.licitacionesHijasSeleccionadas.add(id);
        this.hijasSeleccionadas[id] = true;
      }
    });
  }

  deseleccionarTodasLasHijas() {
    this.licitacionesHijasSeleccionadas.clear();
    this.hijasSeleccionadas = {};
  }

  eliminarLicitacionesSeleccionadas() {
    if (this.licitacionesHijasSeleccionadas.size === 0) {
      alert('Por favor selecciona al menos una licitación para eliminar');
      return;
    }

    const cantidad = this.licitacionesHijasSeleccionadas.size;
    const nombrePadre = this.contratoMarcoEnSeleccion?.Descripcion || this.contratoMarcoEnSeleccion?.NombreLicitacion || 'Sin nombre';

    if (!confirm(`¿Está seguro que desea eliminar ${cantidad} licitación(es) hija(s) del contrato marco "${nombrePadre}"?`)) {
      return;
    }

    this.Loading = true;
    const idsAEliminar = Array.from(this.licitacionesHijasSeleccionadas);
    let eliminacionesCompletadas = 0;
    let errores = 0;

    idsAEliminar.forEach(id => {
      this.http.delete<any>(environment.urlBFF + 'licitaciones/' + id)
        .subscribe({
          next: () => {
            eliminacionesCompletadas++;

            if (this.contratoMarcoEnSeleccion.licitaciones && Array.isArray(this.contratoMarcoEnSeleccion.licitaciones)) {
              const index = this.contratoMarcoEnSeleccion.licitaciones.findIndex(l => l.IdLicitacion === id);
              if (index !== -1) {
                this.contratoMarcoEnSeleccion.licitaciones.splice(index, 1);
              }
            }

            if (eliminacionesCompletadas + errores === idsAEliminar.length) {
              this.Loading = false;
              this.cancelarSeleccion();
              this.CargarLicitacionesYContratos();

              if (errores === 0) {
                alert(`${eliminacionesCompletadas} licitación(es) eliminada(s) correctamente`);
              } else {
                alert(`${eliminacionesCompletadas} eliminada(s) correctamente, ${errores} con errores`);
              }
            }
          },
          error: (error) => {
            console.error('Error al eliminar licitación hija:', error);
            errores++;

            if (eliminacionesCompletadas + errores === idsAEliminar.length) {
              this.Loading = false;
              this.cancelarSeleccion();
              this.CargarLicitacionesYContratos();
              alert(`${eliminacionesCompletadas} eliminada(s) correctamente, ${errores} con errores`);
            }
          }
        });
    });
  }

  eliminarLicitacionesDuplicadas() {
    if (!this.Licitaciones || this.Licitaciones.length === 0) return;

    const idsHijas = new Set<number>();

    this.Licitaciones.forEach(elemento => {
      if (elemento.EsContratoMarco && elemento.licitaciones && Array.isArray(elemento.licitaciones)) {
        elemento.licitaciones.forEach(hija => {
          if (hija.IdLicitacion) {
            idsHijas.add(hija.IdLicitacion);
          }
        });
      }
    });

    this.Licitaciones = this.Licitaciones.filter(elemento => {
      if (elemento.EsContratoMarco) {
        return true;
      }
      return !idsHijas.has(elemento.IdLicitacion);
    });
  }
}