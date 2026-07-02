import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { mTarea } from '../../model/mTarea';
import { CommonModule } from '@angular/common';
import { MainComponent } from '../../main/main.component';
import { TareasLicComponent } from './tareas-lic/tareas-lic.component';
import { ListaBitacoraComponent } from './lista-bitacora/lista-bitacora.component';
import { AddHitoComponent } from './add-hito/add-hito.component';
import { sVis_UsuariosCoordinadores } from './tareas-lic/Externos/sVis_UsuariosCoordinadores.service';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

declare var Swal: any;
declare var $: any;

// Clase Licitaciones para compatibilidad
class Licitaciones {
  idLicitacion: number = 0;
  IdLicitacion: number = 0; // Mantener por compatibilidad con código existente
  NombreLicitacion: string = '';
  Descripcion: string = '';
  descripcion: string = '';
  OfertaInicial: number = 0;
  ofertaInicial: any;
  idEstado: number = 0;
  numeroPropuesta: string = '';
  competitividad: string = '';
  fechaCreacion: string = '';
  fechaRemocion: string | null = null;
  idArea: number = 0;
  idEjecutivo: number = 0;
  idMandante: number = 0;
  idUsuarioCreador: number = 0;
  idUsuarioRemovedor: number | null = null;
  superficie: number | null = null;
  activo: boolean = true;
  // Agregar más propiedades según sea necesario
}

@Component({
  selector: 'app-tabla-licitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent, TareasLicComponent, ListaBitacoraComponent, AddHitoComponent],
  templateUrl: './tabla-licitaciones.component.html',
  styleUrls: ['./tabla-licitaciones.component.css'],
  providers: [sVis_UsuariosCoordinadores]
})
export class TablaLicitacionesComponent implements OnInit {
      private parseHitoFecha(fecha: any): number {
        if (!fecha) {
          return Number.POSITIVE_INFINITY;
        }

        const fechaTexto = String(fecha).trim();
        if (!fechaTexto) {
          return Number.POSITIVE_INFINITY;
        }

        const isoMatch = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          const [, year, month, day] = isoMatch;
          return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
        }

        const latamMatch = fechaTexto.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
        if (latamMatch) {
          const [, day, month, year] = latamMatch;
          return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
        }

        const parsedDate = new Date(fechaTexto);
        const parsedTime = parsedDate.getTime();
        return Number.isNaN(parsedTime) ? Number.POSITIVE_INFINITY : parsedTime;
      }

      private ordenarHitosPorFecha(): void {
        if (!Array.isArray(this.Hitos) || this.Hitos.length === 0) {
          return;
        }

        this.Hitos = [...this.Hitos].sort((a: any, b: any) => {
          const fechaA = this.parseHitoFecha(a?.FechaCompromiso ?? a?.FechaCompromisoInput);
          const fechaB = this.parseHitoFecha(b?.FechaCompromiso ?? b?.FechaCompromisoInput);

          if (fechaA !== fechaB) {
            return fechaA - fechaB;
          }

          const nombreA = String(a?.NombreHito ?? '').localeCompare(String(b?.NombreHito ?? ''), 'es', { sensitivity: 'base' });
          if (nombreA !== 0) {
            return nombreA;
          }

          return Number(a?.IdHitoLicitacion ?? a?.IdHito ?? 0) - Number(b?.IdHitoLicitacion ?? b?.IdHito ?? 0);
        });

        if (this.hitosCurrentPage > this.hitosTotalPages) {
          this.hitosCurrentPage = Math.max(this.hitosTotalPages, 1);
        }
      }

      private getRealHitoIndex(indexEnPagina: number): number {
        return (this.hitosCurrentPage - 1) * this.hitosPageSize + indexEnPagina;
      }

      // Paginación para ofertas económicas
      ofertasPageSize: number = 8;
      ofertasCurrentPage: number = 1;
      ofertasTotalPages(): number {
        return Math.ceil((this.OfertasOrdenadas?.length || 0) / this.ofertasPageSize) || 1;
      }
      ofertasPaginadas(): any[] {
        // Mostrar el último valor primero (orden descendente)
        const ofertasDesc = (this.OfertasOrdenadas || []).slice().reverse();
        const start = this.ofertasOffset();
        return ofertasDesc.slice(start, start + this.ofertasPageSize);
      }
      ofertasOffset(): number {
        return (this.ofertasCurrentPage - 1) * this.ofertasPageSize;
      }
      nextOfertasPage() {
        if (this.ofertasCurrentPage < this.ofertasTotalPages()) {
          this.ofertasCurrentPage++;
        }
      }
      prevOfertasPage() {
        if (this.ofertasCurrentPage > 1) {
          this.ofertasCurrentPage--;
        }
      }
    confirmarOferta() {
      const monto = this.txtContraOferta;
      const moneda = this.monedaOferta;
      Swal.fire({
        title: '¿Confirmar oferta económica?',
        html: `<b>Monto:</b> $${monto} <br><b>Moneda:</b> ${moneda}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, agregar oferta',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.AgregarOferta();
          setTimeout(() => { window.location.reload(); }, 500);
        }
      });
    }
  @ViewChild(ListaBitacoraComponent) listaBitacoraComponent: ListaBitacoraComponent;
  
  monedaOferta: string = 'CLP';
  // Mejoras visuales para Mis Tareas
  tareaSearch: string = '';
  tareasPageSize: number = 8;
  tareasCurrentPage: number = 1;
  get tareasTotalPages(): number {
    return Math.ceil(this.filteredTareasRaw().length / this.tareasPageSize) || 1;
  }

  coordinadores: any[] = [];

  filteredTareasRaw(): mTarea[] {
    if (!this.Tareas) return [];
    const base = (!this.tareaSearch || this.tareaSearch.trim() === '')
      ? this.Tareas
      : (() => {
          const search = this.tareaSearch.toLowerCase();
          return this.Tareas.filter(t =>
            (t.nombreTarea && t.nombreTarea.toLowerCase().includes(search)) ||
            (t.area && t.area.toLowerCase().includes(search)) ||
            (t.prioridad && t.prioridad.toLowerCase().includes(search)) ||
            (t.descripcionTarea && t.descripcionTarea.toLowerCase().includes(search))
          );
        })();

    // Ordenar por ID (más reciente -> más antiguo)
    return [...base].sort((a: any, b: any) => {
      const ida = Number(a?.idTarea ?? a?.IdTarea ?? 0);
      const idb = Number(b?.idTarea ?? b?.IdTarea ?? 0);
      return idb - ida;
    });
  }

  filteredTareas(): mTarea[] {
    const tareas = this.filteredTareasRaw();
    const start = (this.tareasCurrentPage - 1) * this.tareasPageSize;
    return tareas.slice(start, start + this.tareasPageSize);
  }

  nextTareasPage() {
    if (this.tareasCurrentPage < this.tareasTotalPages) {
      this.tareasCurrentPage++;
    }
  }

  prevTareasPage() {
    if (this.tareasCurrentPage > 1) {
      this.tareasCurrentPage--;
    }
  }

  get tareasPendientesCount(): number {
    // idEstadoTarea: 1 = Pendiente, 2 = Completada (ajustar si hay más estados)
    return this.Tareas?.filter(t => t.idEstadoTarea === 1).length || 0;
  }
  get tareasCompletadasCount(): number {
    return this.Tareas?.filter(t => t.idEstadoTarea === 2).length || 0;
  }
  // Paginación de Hitos
  hitosPageSize: number = 10;
  hitosCurrentPage: number = 1;
  get hitosTotalPages(): number {
    return Math.ceil((this.Hitos?.length || 0) / this.hitosPageSize);
  }
  get pagedHitos(): any[] {
    const start = (this.hitosCurrentPage - 1) * this.hitosPageSize;
    return this.Hitos?.slice(start, start + this.hitosPageSize) || [];
  }

  nextHitosPage() {
    if (this.hitosCurrentPage < this.hitosTotalPages) {
      this.hitosCurrentPage++;
    }
  }

  prevHitosPage() {
    if (this.hitosCurrentPage > 1) {
      this.hitosCurrentPage--;
    }
  }

  Licitacion: Licitaciones;
  tarea: mTarea
  Hitos = [];
  // Para compatibilidad, cada hito puede tener HoraCompromiso
  Ofertas;
  OfertasOrdenadas: any[] = [];
  Hoy = new Date();
  rowHitos: boolean;
  rowGestion: boolean;
  rowTareas: boolean;
  nomlic: string;
  HitosLicitaciones;
  OcultaOferta;
  //Controles
  drdEstado: number = 0;
  txtOferta;
  txtContraOferta;
  txtHoraOferta: string = this.getHoraChile();
  getHoraChile(): string {
    // Hora actual Chile (America/Santiago)
    const date = new Date();
    // Ajuste manual para Chile: UTC-4 (invierno), UTC-3 (verano)
    // Si tienes moment-timezone, usaría moment.tz('America/Santiago').format('HH:mm')
    // Aquí solo JS nativo:
    let offset = -4; // Invierno
    // Verano: entre septiembre y abril
    const mes = date.getMonth() + 1;
    if (mes >= 9 || mes <= 4) offset = -3;
    const utc = date.getUTCHours();
    let horaChile = utc + offset;
    if (horaChile < 0) horaChile += 24;
    if (horaChile >= 24) horaChile -= 24;
    const minutos = date.getMinutes();
    return `${horaChile.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }
  txtBitacora;
  Estados = [];
  Tareas: mTarea[];

  //Generales
  usuario: any = {}

  //Cargando
  Loading: boolean[] = [false, false];
  LoadingTabla: boolean[] = [true, true, true, true];
  cargandoLic = true;
  btnBitacoraDis: boolean;

  //Mensajes
  msg: string;

  //Url
  urlBase: string = environment.urlBFF;
  controlador: string = "licitaciones/";
  urlFull: string = this.urlBase + this.controlador;

  //Mensajes de error
  errorOferta: string;
  errorContraOferta: string;
  errorComentario: string;

  //PopUp
  addHito: boolean;

  constructor(
    private http: HttpClient,
    private route: Router,
    private coordinadoresService: sVis_UsuariosCoordinadores,
    private ngZone: NgZone
  ) {

    this.rowHitos = true;
    this.rowGestion = false;
    this.rowTareas = false;
    this.Tareas = [];
    this.usuario = JSON.parse(localStorage.usuario);
    this.tarea = new mTarea(null, null, null, null, null, null, null, null, null, 1, this.retFecha(this.Hoy), true, null, this.usuario.idUsuario, null, null, null)
    this.addHito = false;
    this.btnBitacoraDis = false;
  }

  ngOnInit() {
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");

    console.log('Valor inicial de cargandoLic:', this.cargandoLic);
    if (!localStorage.hasOwnProperty('Licitacion')) {
      console.log("No se ha seleccionado una licitacion");
    } else {
      try {
        this.usuario = JSON.parse(localStorage.usuario);
        this.Licitacion = JSON.parse(localStorage.Licitacion);
        console.log('Licitacion cargada en ngOnInit:', this.Licitacion);

        this.http.get<any>(this.urlFull + this.Licitacion.IdLicitacion)
          .subscribe(data => {
            this.Licitacion = data;
            console.log('Licitacion actualizada desde API:', this.Licitacion);
          })

        this.nomlic = this.Licitacion.Descripcion;

        this.GetHitosLicitaciones();
        this.GetEstado();
        this.GetOfertas();

        this.drdEstado = this.Licitacion.idEstado;
      }
      catch (err) {
        console.log(err.message);
      }
    }

    if (this.Licitacion && (this.Licitacion.OfertaInicial === undefined || this.Licitacion.OfertaInicial === null)) {
      this.txtOferta = "";
      this.OcultaOferta = true;
    } else if (this.Licitacion) {
      this.txtOferta = this.Licitacion.OfertaInicial;
      this.OcultaOferta = false;
      $("#txtOferta").attr('disabled', 'disabled');
    }
    this.obtenerCoordinadores();
    this.listarTareas();
    console.log('Licitacion al final de ngOnInit:', this.Licitacion);
    // console.log(this.tarea);
  }

  MisLicitaciones() {
    this.route.navigate(['/Licitacion-MisLicitaciones']);
  }

  //******************************************Licitaciones******************************************

  GetEstado() {
    this.http.get<any[]>(environment.urlBase + 'Estado/')
      .subscribe(Estados => {
        // console.log(Estados);
        // Agregar Contra Oferta y Revision si no existen
        const nuevosEstados = [
          { IdEstado: 11, NombreEstado: 'Contra Oferta', color: '#ffe0ec', textColor: '#a64ca6' },
          { IdEstado: 12, NombreEstado: 'Revision', color: '#e0f7fa', textColor: '#00796b' },
          { IdEstado: 13, NombreEstado: 'Revision1', color: '#e0f7fa', textColor: '#00796b' },
          { IdEstado: 14, NombreEstado: 'Revision2', color: '#e0f7fa', textColor: '#00796b' },
          { IdEstado: 15, NombreEstado: 'Revision3', color: '#e0f7fa', textColor: '#00796b' }
        ];
        // Agregar Preadjudicada si no existe
        const preadjudicadaEstado = { IdEstado: 16, NombreEstado: 'Preadjudicada', color: '#bbfa98', textColor: '#388e3c' };
        if (!Estados.some(e => e.IdEstado === preadjudicadaEstado.IdEstado)) {
          Estados.push(preadjudicadaEstado);
        }
        nuevosEstados.forEach(ne => {
          if (!Estados.some(e => e.IdEstado === ne.IdEstado)) {
            Estados.push(ne);
          }
        });
        this.Estados = Estados;
        this.Calendar();

      })
  }

  GetHitosLicitaciones() {
    let i: number = 0;
    const idLicitacion = this.Licitacion?.IdLicitacion || this.Licitacion?.idLicitacion;
    if (!idLicitacion) {
      console.error('No se puede obtener hitos: IdLicitacion es undefined');
      this.LoadingTabla[0] = false;
      return;
    }
        this.http.get<any[]>(environment.urlBase + 'Licitaciones/GetHitosHitosLicitacionByLicitaciones/IdLicitacion=' + idLicitacion)
          .subscribe({
          next: (HitosLic) => {
            // Elimina duplicados por IdHito, quedándose con el registro "más nuevo"
            // (normalmente el mayor IdHitoLicitacion cuando el backend crea nuevos en POST)
            const bestByIdHito = new Map<number, any>();
            for (const hito of HitosLic) {
              const key = Number(hito.IdHito);
              const current = bestByIdHito.get(key);
              const currentId = Number(current?.IdHitoLicitacion || 0);
              const candidateId = Number(hito?.IdHitoLicitacion || 0);
              if (!current || candidateId >= currentId) {
                bestByIdHito.set(key, hito);
              }
            }

            const uniqueHitos: any[] = [];
            const pushed = new Set<number>();
            for (const hito of HitosLic) {
              const key = Number(hito.IdHito);
              if (pushed.has(key)) continue;
              uniqueHitos.push(bestByIdHito.get(key) ?? hito);
              pushed.add(key);
            }

            this.Hitos = uniqueHitos;
            // Campo auxiliar para edición en UI (texto dd/MM/yyyy)
            for (const hito of this.Hitos as any[]) {
              // Normalizar estado para que los *ngIf del template funcionen bien
              // (evita espacios/casing raros desde backend)
              const estadoRaw = String(hito.Estado ?? '').trim();
              const estadoLower = estadoRaw.toLowerCase();
              if (estadoLower === 'terminado' || estadoLower === 'completado') {
                hito.Estado = 'Terminado';
              } else if (estadoLower === 'pendiente') {
                hito.Estado = 'Pendiente';
              } else if (estadoRaw) {
                hito.Estado = estadoRaw;
              }

              // Para <input type="date"> usamos yyyy-MM-dd
              hito.FechaCompromisoInput = this.normalizeFechaCompromisoForSave(String(hito.FechaCompromiso || ''));
            }
            this.ordenarHitosPorFecha();
            this.LoadingTabla[0] = false;
            this.Calendar();
          },
          error: (err) => {
            console.error('Error al obtener hitos de licitación', err);
            this.LoadingTabla[0] = false;
          }
        })
  }

  retFecha(now) {
    var dd = now.getDate();
    var mm = now.getMonth() + 1; //January is 0!
    var yyyy = now.getFullYear();

    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }

    return dd + '/' + mm + '/' + yyyy;
  }

  PestHito() {
    this.rowHitos = true;
    this.rowGestion = false;
    this.rowTareas = false;
    $("#TabControl").attr("class", "nav-link active")
    $("#TabBitacora").attr("class", "nav-link")
    $("#TabTarea").attr("class", "nav-link")
  }

  PestGestion() {
    this.rowHitos = false;
    this.rowGestion = true;
    this.rowTareas = false;
    this.cargandoLic = true;
    $("#TabControl").attr("class", "nav-link ")
    $("#TabBitacora").attr("class", "nav-link active")
    $("#TabTarea").attr("class", "nav-link")
    // Recargar bitácoras al cambiar a la pestaña
    setTimeout(() => {
      if (this.listaBitacoraComponent) {
        this.listaBitacoraComponent.GetComentarios();
      }
    }, 100);
  }

  PestTareas() {
    this.rowHitos = false;
    this.rowGestion = false;
    this.rowTareas = true;
    $("#TabControl").attr("class", "nav-link ")
    $("#TabBitacora").attr("class", "nav-link")
    $("#TabTarea").attr("class", "nav-link active")
  }

  Calendar() {
    const $dates = $(".date");
    $dates.each(function () {
      const $el = $(this);
      // Evitar re-inicialización: causa popup sin setear el input
      if ($el.data('DateTimePicker')) return;
      $el.datetimepicker({ format: 'DD/MM/YYYY' });
    });

    // Cuando el usuario elige fecha, escribir en el input y guardar automáticamente
    $(".date")
      .off('dp.change.hitos')
      .on('dp.change.hitos', (ev: any) => {
        const inputEl = $(ev.currentTarget).find('input')[0] as HTMLInputElement | undefined;
        if (!inputEl) return;

        if (ev?.date && typeof ev.date.format === 'function') {
          inputEl.value = ev.date.format('DD/MM/YYYY');
        }

        const idxText = (inputEl.id || '').replace('txtCaledario', '');
        const idx = Number.parseInt(idxText, 10);
        if (Number.isNaN(idx)) return;

        // Asegurar que Angular ejecute el guardado
        this.ngZone.run(() => this.onFechaCompromisoInputChange(idx, inputEl.value));
      });
  }

  formatFechaCompromisoDisplay(value: any): string {
    if (!value) return '';

    const raw = String(value).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;

    const ymd = this.normalizeFechaCompromisoForSave(raw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return raw;
    const [yyyy, mm, dd] = ymd.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  private normalizeFechaCompromisoForSave(rawValue: string): string {
    if (!rawValue) return '';
    const raw = String(rawValue).trim();

    // ISO: yyyy-MM-ddTHH:mm:ss...
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.substring(0, 10);
    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // dd/MM/yyyy
    const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return raw;
  }

  onFechaCompromisoInputChange(indexEnPagina: number, rawValue: string) {
    const normalized = this.normalizeFechaCompromisoForSave(rawValue);
    const realIndex = this.getRealHitoIndex(indexEnPagina);

    console.log('[HITOS][FechaCompromiso][change]', {
      indexEnPagina,
      hitosCurrentPage: this.hitosCurrentPage,
      hitosPageSize: this.hitosPageSize,
      realIndex,
      rawValue,
      normalized,
    });

    if (!this.Hitos || realIndex < 0 || realIndex >= this.Hitos.length) {
      console.warn('[HITOS][FechaCompromiso][change] Índice fuera de rango o Hitos undefined', {
        length: this.Hitos?.length,
        realIndex,
      });
      return;
    }

    (this.Hitos as any[])[realIndex].FechaCompromiso = normalized;
    (this.Hitos as any[])[realIndex].FechaCompromisoInput = normalized;
    this.ordenarHitosPorFecha();

    // Guardar automáticamente cuando sea una fecha completa
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      console.warn('[HITOS][FechaCompromiso][change] Fecha no válida para guardar (esperado yyyy-MM-dd)', {
        normalized,
      });
      return;
    }

    const payload = {
      fechaCompromiso: normalized,
      horaCompromiso: this.Hitos[realIndex].HoraCompromiso || '00:00',
      estado: this.Hitos[realIndex].Estado || 'Pendiente',
    };
    console.log('[HITOS][FechaCompromiso][autosave] Llamando actualizarHito', {
      realIndex,
      payload,
      hito: this.Hitos[realIndex],
    });
    this.actualizarHito(realIndex, payload, { silent: true });
  }

  //******************************************Hitos******************************************

  cerrarPopUp() {
    this.GetHitosLicitaciones();
    this.addHito = false;
  }

  Guardar(form: NgForm) {
    let loc = this;
    this.Loading[0] = true;
    let pagLic = this.urlFull + this.Licitacion.idLicitacion;
    let licitacionPayload: any = { ...this.Licitacion };
    delete licitacionPayload.IdLicitacion;
    delete licitacionPayload.idLicitacion;
    licitacionPayload.idEstado = Number(this.drdEstado);
    licitacionPayload.ofertaInicial = Number(licitacionPayload.ofertaInicial);
    licitacionPayload.superficie = (typeof licitacionPayload.superficie === 'number' && !isNaN(licitacionPayload.superficie)) ? licitacionPayload.superficie : 0;
    if (!licitacionPayload.fechaRemocion || licitacionPayload.fechaRemocion === "") {
      licitacionPayload.fechaRemocion = null;
    } else {
      const fecha = new Date(licitacionPayload.fechaRemocion);
      licitacionPayload.fechaRemocion = isNaN(fecha.getTime()) ? null : fecha.toISOString();
    }
    licitacionPayload.idUsuarioRemovedor = (typeof licitacionPayload.idUsuarioRemovedor === 'number' && !isNaN(licitacionPayload.idUsuarioRemovedor)) ? licitacionPayload.idUsuarioRemovedor : 0;
    console.log('Objeto enviado al backend (PUT licitacion):', licitacionPayload);
    Swal.fire({
      title: '¿Seguro que quieres cambiar el estado?',
      text: 'Esta acción actualizará el estado de la licitación.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Determinar si es un contrato marco (verificar si tiene la propiedad en el objeto almacenado)
        const licitacionStorage: any = this.Licitacion;
        const esContratoMarco = licitacionStorage.EsContratoMarco === true || licitacionStorage.TipoLicitacion === 'contrato_marco';
        const endpoint = esContratoMarco 
          ? environment.urlBFF + 'contrato_m/' + this.Licitacion.IdLicitacion
          : pagLic;
        
        // Preparar payload específico para contrato marco si aplica
        const payload = esContratoMarco ? {
          idEstado: Number(this.drdEstado),
          name: licitacionStorage.Descripcion || this.Licitacion.Descripcion,
          description: licitacionStorage.Descripcion || this.Licitacion.Descripcion,
          filename: this.Licitacion.numeroPropuesta,
          competitividad: this.Licitacion.competitividad,
          idArea: this.Licitacion.idArea,
          idMandante: this.Licitacion.idMandante,
          idEjecutivo: this.Licitacion.idEjecutivo
        } : licitacionPayload;
        
        this.http.put<any>(endpoint, payload)
          .pipe(
            timeout(10000), // 10 segundos
            catchError(err => {
              loc.Loading[0] = false;
              loc.msg = "Error de conexión o tiempo de espera agotado";
              loc.MensajeError();
              if (form && form.form) {
                form.form.enable();
              }
              $("#drdEstado").removeAttr("disabled");
              $("#btnGuardarEstado").removeAttr("disabled");
              return throwError(() => err);
            })
          )
          .subscribe({
            next: (result) => {
              this.Licitacion.idEstado = licitacionPayload.idEstado;
              this.drdEstado = licitacionPayload.idEstado;
              
              // Recargar datos desde el backend correcto
              const getEndpoint = esContratoMarco
                ? environment.urlBFF + 'contrato_m/' + this.Licitacion.IdLicitacion
                : this.urlFull + this.Licitacion.idLicitacion;
              
              this.http.get<any>(getEndpoint)
                .subscribe(data => {
                  if (esContratoMarco) {
                    // El endpoint GET de contrato_m devuelve un objeto único
                    this.Licitacion.idEstado = data.idEstado;
                    this.drdEstado = data.idEstado;
                    this.nomlic = data.name || data.Descripcion;
                  } else {
                    this.Licitacion = data;
                    this.drdEstado = data.idEstado;
                    this.nomlic = data.Descripcion;
                  }
                  // Actualizar el nombre del estado en el select
                  setTimeout(() => {
                    this.drdEstado = this.Licitacion.idEstado;
                  }, 0);
                });
              loc.Loading[0] = false;
              if (form && form.form) {
                form.form.enable();
              }
              $("#drdEstado").removeAttr("disabled");
              $("#btnGuardarEstado").removeAttr("disabled");

              Swal.fire({
                title: 'Estado guardado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              }).then(() => {
                window.location.reload();
              });
            },
            error: () => {
              // Ya manejado en catchError
            }
          });
      }
    });
  }

  Completado(i: number) {
      // Calcular índice real considerando paginación
      const realIndex = this.getRealHitoIndex(i);
      if (realIndex >= this.Hitos.length) {
        console.error('Índice fuera de rango');
        return;
      }
      // Este botón SOLO marca como cumplido. No debe cambiar la fecha.
      // Usamos el valor del modelo (ngModel) y no el DOM.
      const fechaDesdeModelo = (this.Hitos as any[])[realIndex]?.FechaCompromisoInput;
      const fechaDesdeBackend = this.formatDateForInput(this.Hitos[realIndex]?.FechaCompromiso);
      let fechaCompromiso = (fechaDesdeModelo || fechaDesdeBackend || '').toString();
      console.log('[HITOS][Completado] click', {
        indexEnPagina: i,
        realIndex,
        fechaDesdeInput: fechaCompromiso,
        hito: this.Hitos[realIndex],
      });

      // No inventar/forzar fecha al completar: si está vacía, pedir que la seleccione.
      if (!fechaCompromiso) {
        Swal.fire({
          title: 'Falta fecha',
          text: 'Selecciona una fecha compromiso antes de marcar como cumplido.',
          icon: 'warning',
          confirmButtonColor: '#f48826'
        });
        return;
      }

      // Optimistic UI: marcar inmediatamente como terminado.
      this.Hitos[realIndex].Estado = 'Terminado';
      console.log('[HITOS][Completado] Llamando actualizarHito', {
        realIndex,
        fechaCompromiso,
        horaCompromiso: this.Hitos[realIndex].HoraCompromiso || "00:00",
      });
      this.actualizarHito(realIndex, {
        fechaCompromiso: fechaCompromiso,
        horaCompromiso: this.Hitos[realIndex].HoraCompromiso || "00:00",
        estado: "Terminado"
      }, { silent: true, forcePost: true, skipRefresh: true });
  }

  Descompletar(i: number) {
      // Calcular índice real considerando paginación
      const realIndex = this.getRealHitoIndex(i);
      if (realIndex >= this.Hitos.length) {
        console.error('Índice fuera de rango');
        return;
      }

      console.log('[HITOS][Descompletar] click', {
        indexEnPagina: i,
        realIndex,
        hito: this.Hitos[realIndex],
      });

      // Confirmar antes de deshacer
      Swal.fire({
        title: '¿Deshacer completado?',
        text: '¿Estás seguro de que quieres marcar este hito como pendiente nuevamente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-undo"></i> Sí, deshacer',
        cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
        confirmButtonColor: '#ff9800',
        cancelButtonColor: '#6c757d',
      }).then((result) => {
        if (result.isConfirmed) {
          // Optimistic UI: marcar inmediatamente como pendiente
          this.Hitos[realIndex].Estado = 'Pendiente';
          console.log('[HITOS][Descompletar] Llamando actualizarHito', {
            realIndex,
          });
          this.actualizarHito(realIndex, {
            fechaCompromiso: this.formatDateForInput(this.Hitos[realIndex].FechaCompromiso),
            horaCompromiso: this.Hitos[realIndex].HoraCompromiso || "00:00",
            estado: "Pendiente"
          }, { silent: true, forcePost: true, skipRefresh: true });
        }
      });
  }

  EditarHito(i: number) {
    const realIndex = this.getRealHitoIndex(i);
    const hito = this.Hitos[realIndex];
    Swal.fire({
      title: 'Editar Hito',
      html: `
        <div class="form-group mb-3">
          <label for="editFechaCompromiso" class="form-label">Fecha Compromiso:</label>
          <input type="date" id="editFechaCompromiso" class="form-control" value="${this.formatDateForInput(hito.FechaCompromiso)}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-save"></i> Guardar',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const fechaCompromiso = (document.getElementById('editFechaCompromiso') as HTMLInputElement).value;
        if (!fechaCompromiso) {
          Swal.showValidationMessage('La fecha compromiso es requerida');
          return false;
        }
        return {
          fechaCompromiso: fechaCompromiso,
          horaCompromiso: hito.HoraCompromiso || '00:00', // Mantener la hora actual
          estado: hito.Estado // Mantener el estado actual, no editable
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.actualizarHito(realIndex, result.value);
      }
    });
  }

  EliminarHito(i: number) {
    const realIndex = this.getRealHitoIndex(i);
    const hito = this.Hitos[realIndex];
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el hito "${hito.NombreHito}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-trash"></i> Sí, eliminar',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarHito(realIndex);
      }
    });
  }

  private actualizarHito(i: number, datos: any, options?: { silent?: boolean; forcePost?: boolean; skipRefresh?: boolean }) {
    let loc = this;
    // En autosave (silent) evitamos bloquear toda la UI con loader.
    if (!options?.silent) {
      this.Loading[0] = true;
    }
    let pag = environment.urlBase + "HitosLicitacion/";
    let hora = this.Hitos[i].HoraCompromiso || "00:00";
    if (datos.horaCompromiso) {
      hora = datos.horaCompromiso;
      this.Hitos[i].HoraCompromiso = hora;
    }
    let fecha = datos.fechaCompromiso;
    if (hora && fecha) {
      // Si la fecha viene en formato yyyy-MM-dd, agregar la hora
      if (fecha.length === 10) {
        fecha = fecha + "T" + hora + ":00";
      }
    }
    const HitoLicitacion = {
      IdHitoLicitacion: this.Hitos[i].IdHitoLicitacion,
      IdHito: this.Hitos[i].IdHito,
      IdLicitacion: this.Hitos[i].IdLicitacion,
      FechaCompromiso: fecha,
      Estado: datos.estado,
      FechaCreacion: this.Hitos[i].FechaCreacion,
      IdUsuarioCreador: this.Hitos[i].IdUsuarioCreador,
      Activo: true,
      HoraCompromiso: hora
    };

    // Enviar como application/x-www-form-urlencoded (mismo patrón que addHito)
    const params = new URLSearchParams();
    if (HitoLicitacion?.IdHitoLicitacion !== undefined && HitoLicitacion?.IdHitoLicitacion !== null) params.set('IdHitoLicitacion', String(HitoLicitacion.IdHitoLicitacion));
    if (HitoLicitacion?.IdHito !== undefined && HitoLicitacion?.IdHito !== null) params.set('IdHito', String(HitoLicitacion.IdHito));
    if (HitoLicitacion?.IdLicitacion !== undefined && HitoLicitacion?.IdLicitacion !== null) params.set('IdLicitacion', String(HitoLicitacion.IdLicitacion));
    if (HitoLicitacion?.FechaCompromiso !== undefined && HitoLicitacion?.FechaCompromiso !== null) params.set('FechaCompromiso', String(HitoLicitacion.FechaCompromiso));
    if (HitoLicitacion?.Estado !== undefined && HitoLicitacion?.Estado !== null) params.set('Estado', String(HitoLicitacion.Estado));
    if (HitoLicitacion?.FechaCreacion !== undefined && HitoLicitacion?.FechaCreacion !== null) params.set('FechaCreacion', String(HitoLicitacion.FechaCreacion));
    if (HitoLicitacion?.IdUsuarioCreador !== undefined && HitoLicitacion?.IdUsuarioCreador !== null) params.set('IdUsuarioCreador', String(HitoLicitacion.IdUsuarioCreador));
    if (HitoLicitacion?.Activo !== undefined && HitoLicitacion?.Activo !== null) params.set('Activo', String(HitoLicitacion.Activo));
    if (HitoLicitacion?.HoraCompromiso !== undefined && HitoLicitacion?.HoraCompromiso !== null) params.set('HoraCompromiso', String(HitoLicitacion.HoraCompromiso));
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };

    console.log('[HITOS][actualizarHito] request', {
      i,
      url: pag,
      datos,
      HitoLicitacion,
      silent: options?.silent ?? false,
      forcePost: options?.forcePost ?? false,
    });

    const onSuccess = (result: any) => {
      console.log('[HITOS][actualizarHito] OK', { result });

      // Algunos backends responden 200/204 sin body => HttpClient entrega null.
      // En ese caso mantenemos lo que el usuario guardó para no "rebotar" la UI.
      const effectiveResult = result ?? {};

      // Actualizar inmediatamente el modelo local con lo que se envió.
      if (datos?.fechaCompromiso) {
        // Mantener el string que espera el backend/UI.
        this.Hitos[i].FechaCompromiso = datos.fechaCompromiso;
        (this.Hitos as any[])[i].FechaCompromisoInput = this.normalizeFechaCompromisoForSave(String(datos.fechaCompromiso || ''));
      }
      if (datos?.estado) {
        this.Hitos[i].Estado = String(datos.estado ?? '').trim();
      }
      if (datos?.horaCompromiso) {
        this.Hitos[i].HoraCompromiso = datos.horaCompromiso;
      }

      // Importante: el backend puede crear un nuevo IdHitoLicitacion en vez de actualizar.
      // Para no quedar apuntando al registro viejo, sincronizamos el ID y valores principales.
      if (effectiveResult?.IdHitoLicitacion) {
        this.Hitos[i].IdHitoLicitacion = effectiveResult.IdHitoLicitacion;
      }
      if (effectiveResult?.FechaCompromiso) {
        this.Hitos[i].FechaCompromiso = effectiveResult.FechaCompromiso;
        (this.Hitos as any[])[i].FechaCompromisoInput = this.normalizeFechaCompromisoForSave(String(effectiveResult.FechaCompromiso || ''));
      }
      if (effectiveResult?.Estado) {
        this.Hitos[i].Estado = String(effectiveResult.Estado ?? '').trim();
      }

      // Canonicalizar estados esperados por el template
      const estadoFinalRaw = String(this.Hitos[i]?.Estado ?? '').trim();
      const estadoFinalLower = estadoFinalRaw.toLowerCase();
      if (estadoFinalLower === 'terminado' || estadoFinalLower === 'completado') {
        this.Hitos[i].Estado = 'Terminado';
      } else if (estadoFinalLower === 'pendiente') {
        this.Hitos[i].Estado = 'Pendiente';
      } else {
        this.Hitos[i].Estado = estadoFinalRaw;
      }
      if (effectiveResult?.HoraCompromiso) {
        this.Hitos[i].HoraCompromiso = effectiveResult.HoraCompromiso;
      }

      this.ordenarHitosPorFecha();

      if (!options?.silent) {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Hito actualizado correctamente',
          icon: 'success',
          confirmButtonColor: '#28a745',
          timer: 2000
        });
      }
      loc.Loading[0] = false;

      // En autosave (silent) normalmente no recargamos para evitar que el backend (sin body o con delay)
      // haga "rebotar" el valor en UI. Excepción: cuando se marca como cumplido (forcePost), recargamos
      // para confirmar que el cambio quedó persistido.
      if (!options?.skipRefresh && (!options?.silent || options?.forcePost)) {
        loc.GetHitosLicitaciones();
      }
    };

    const onError = (xhr: any) => {
      console.error('[HITOS][actualizarHito] ERROR', xhr);
      if (!options?.silent) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el hito',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
      loc.Loading[0] = false;
      if (!options?.skipRefresh && (!options?.silent || options?.forcePost)) {
        loc.GetHitosLicitaciones();
      }
    };

    // Si existe IdHitoLicitacion, preferir PUT para NO generar duplicados en el backend.
    const existingId = Number(this.Hitos[i]?.IdHitoLicitacion || 0);
    if (existingId > 0) {
      // En autosave o cuando se fuerce, preferimos POST porque hay backends que persisten
      // creando un nuevo registro (y el PUT puede responder 200 con body vacío sin guardar).
      if (options?.silent || options?.forcePost) {
        console.log('[HITOS][actualizarHito] usando POST (append)', { existingId, forcePost: options?.forcePost ?? false });
        this.http.post<any>(pag, params, { headers }).subscribe({ next: onSuccess, error: onError });
        return;
      }

      const putUrl = pag + existingId;
      console.log('[HITOS][actualizarHito] Intentando PUT', { putUrl, existingId });
      this.http.put<any>(putUrl, params, { headers }).subscribe({
        next: (res) => {
          // Si el backend devuelve null, al menos mantenemos la UI estable.
          // Para acciones no-silent, intentamos refrescar desde backend en onSuccess.
          onSuccess(res);
        },
        error: (xhr) => {
          // Fallback por si el backend no soporta PUT.
          console.warn('[HITOS][actualizarHito] PUT falló, fallback a POST', xhr);
          this.http.post<any>(pag, params, { headers }).subscribe({ next: onSuccess, error: onError });
        }
      });
      return;
    }

    this.http.post<any>(pag, params, { headers }).subscribe({ next: onSuccess, error: onError });
  }

  private eliminarHito(i: number) {
    let loc = this;
    this.Loading[0] = true;
    let pag = environment.urlBase + "HitosLicitacion/" + this.Hitos[i].IdHitoLicitacion;
    this.http.delete<any>(pag).subscribe({
      next: (result) => {
        loc.Loading[0] = false;
        Swal.fire({
          title: '¡Eliminado!',
          text: 'Hito eliminado correctamente',
          icon: 'success',
          confirmButtonColor: '#28a745',
          timer: 2000
        });
        // Recargar hitos desde el backend para evitar duplicados y problemas de sincronización
        loc.GetHitosLicitaciones();
      },
      error: (xhr) => {
        loc.Loading[0] = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el hito',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
        // Recargar hitos para mantener consistencia
        loc.GetHitosLicitaciones();
      }
    });
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  //******************************************Oferta******************************************

  GetOfertas() {
    const idLicitacion = this.Licitacion?.IdLicitacion || this.Licitacion?.idLicitacion;
    let pag = environment.urlBase + 'ContraOferta/GetContraOfertaByIdLicitacion/IdLicitacion=' + idLicitacion;
    this.http.get<any[]>(pag)
      .subscribe({
      next: (data) => {
        this.Ofertas = data;
        // Ordenar las ofertas por fecha de creación (cronológico)
        this.OfertasOrdenadas = [...data].sort((a, b) => {
          const fechaA = new Date(a.FechaCreacion);
          const fechaB = new Date(b.FechaCreacion);
          return fechaA.getTime() - fechaB.getTime();
        });
        this.LoadingTabla[1] = false;
        this.Calendar();
      },
      error: (err) => {
        console.error('Error al obtener ofertas de licitación', err);
        this.LoadingTabla[1] = false;
      }
    })
  }

  GuardarOferta(form: NgForm) {
    if (this.ValidaOferta(form)) {
      let loc = this;
      this.Loading[1] = true;
      let pag = this.urlFull + this.Licitacion.idLicitacion;
      // Crear payload sin campos de identidad
      let licitacionPayload: any = { ...this.Licitacion };
      delete licitacionPayload.IdLicitacion;
      delete licitacionPayload.idLicitacion;
      licitacionPayload.OfertaInicial = this.txtOferta;
      licitacionPayload.ofertaInicial = this.txtOferta;
      // Validar fechaRemocion
      if (!licitacionPayload.fechaRemocion || licitacionPayload.fechaRemocion === "") {
        licitacionPayload.fechaRemocion = null;
      } else {
        const fecha = new Date(licitacionPayload.fechaRemocion);
        licitacionPayload.fechaRemocion = isNaN(fecha.getTime()) ? null : fecha.toISOString();
      }
      this.http.put<any>(pag, licitacionPayload)
        .pipe(
          timeout(10000), // 10 segundos
          catchError(err => {
            loc.Loading[1] = false;
            loc.msg = "Error de conexión o tiempo de espera agotado";
            loc.MensajeError();
            return throwError(() => err);
          })
        )
        .subscribe({
          next: (result) => {
            this.Licitacion.OfertaInicial = this.txtOferta;
            this.Licitacion.ofertaInicial = this.txtOferta;
            loc.msg = "Se ha cargado la oferta";
            loc.Mensaje();
            loc.OcultaOferta = false;
            loc.Loading[1] = false;
          },
          error: () => {
            // Ya manejado en catchError
          }
        });
      form.reset();
    }
  }

  ValidaOferta(OGForm: NgForm): boolean {
    if (this.txtOferta == "" || this.txtOferta === undefined || this.txtOferta === null) {
      $("#txtOferta").attr("class", "form-control error")
      this.errorOferta = "Debe ingresar valor"
      return false
    }
    return true
  }

  //ContraOferta
  AgregarOferta() {
    console.log('=== INICIO AgregarOferta ===');
    console.log('txtHoraOferta:', this.txtHoraOferta);
    
    // Setear hora actual Chile si el campo está vacío
    if (!this.txtHoraOferta) {
      this.txtHoraOferta = this.getHoraChile();
      console.log('Hora Chile seteada:', this.txtHoraOferta);
    }
    
    console.log('Licitacion:', this.Licitacion);
    console.log('Usuario:', this.usuario);
    
    // Obtener IdLicitacion compatible con mayúscula o minúscula
    const idLicitacion = this.Licitacion?.IdLicitacion || this.Licitacion?.idLicitacion;
    
    // Validar que exista Licitacion y sus propiedades
    if (!this.Licitacion || !idLicitacion) {
      console.error('ERROR: No hay licitación o IdLicitacion es undefined');
      this.msg = "Error: No hay una licitación seleccionada";
      this.MensajeError();
      return;
    }
    
    if (!this.usuario || !this.usuario.idUsuario) {
      console.error('ERROR: No hay usuario o idUsuario es undefined');
      this.msg = "Error: No hay un usuario autenticado";
      this.MensajeError();
      return;
    }
    
    console.log('txtContraOferta:', this.txtContraOferta);
    
    let loc = this;
    if (this.ValidaContraoferta()) {
      this.Loading[1] = true;
      // Guardar fecha actual
      const now = new Date();
      const fechaLocal = now.getFullYear() + '-' + (now.getMonth()+1).toString().padStart(2,'0') + '-' + now.getDate().toString().padStart(2,'0');
      
      // Crear URLSearchParams para enviar como application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.set('ValorContraoferta', this.txtContraOferta);
      params.set('IdLicitacion', idLicitacion.toString());
      params.set('IdUsuarioCreador', this.usuario.idUsuario.toString());
      params.set('FechaCreacion', fechaLocal);
      params.set('Moneda', this.monedaOferta || 'CLP');
      
      let pag = environment.urlBase + "ContraOferta/";
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      
      // Agregar timeout de 10 segundos
      let timeoutId = setTimeout(() => {
        loc.Loading[1] = false;
        loc.msg = "La petición de contraoferta está tardando demasiado. Intenta nuevamente.";
        loc.MensajeError();
        // Re-habilitar controles y limpiar estado
        $("#txtContraOferta").removeAttr("disabled");
        $("#txtOferta").removeAttr("disabled");
        this.txtContraOferta = "";
      }, 10000);
      this.http.post<any>(pag, params.toString(), { headers }).subscribe({
        next: (result) => {
          clearTimeout(timeoutId);
          loc.msg = "Se ha cargado el elemento";
          loc.Mensaje();
          loc.GetOfertas();
          loc.Loading[1] = false;
        },
        error: (xhr) => {
          clearTimeout(timeoutId);
          loc.Loading[1] = false;
          loc.msg = "Error al guardar la contraoferta. Intenta nuevamente.";
          loc.MensajeError();
        }
      });
      this.txtContraOferta = "";
      $("#txtOferta").focus();
    }
  }

  ValidaContraoferta() {
    if (this.txtContraOferta == "" || this.txtContraOferta === undefined || this.txtContraOferta === null) {
      $("#txtContraOferta").attr("class", "form-control error");
      this.errorContraOferta = "Debe ingresar valor";
      return false;
    }
    return true
  }

  CleanOferta() {
    this.errorOferta = ""
    this.Clean("#txtOferta")
  }

  CleanContraoferta() {
    this.errorContraOferta = "";
    this.Clean("#txtContraOferta");
  }

  //******************************************Comentarios******************************************
  GuardarComentario(form: NgForm) {
    //console.log($("#fileupload1")[0].files.name);
    //console.log(form.value)
    this.btnBitacoraDis = true;
    this.cargandoLic = false;
    if (this.ValidaComentario()) {
      console.clear();
      //Guardar
      let loc = this;

      this.Loading[2] = true;

      let Comentario

      Comentario = {
        Comentario: $("#txtBitacora").val(),
        IdLicitacion: this.Licitacion?.IdLicitacion || this.Licitacion?.idLicitacion,
        FechaCreacion: this.retFecha(this.Hoy),
        IdUsuarioCreador: this.usuario.idUsuario,
        Activo: 1,
      }

      if ($("#fileupload1")[0].files.length > 0) {
        this.AdjuntarArchivo($("#fileupload1")[0].files[0], "Finanzas").then(file => {
          // console.log(file);
        });
        Comentario.ArchivoAdjunto = $("#fileupload1")[0].files[0].name
      }

      this.guardaComentario(Comentario)
      //Permanente
      loc.Loading[2] = false;
      $("#txtBitacora").val("");
      $("#NombreArch").html("");
      $("#fileupload1")[0].value = "";
    }
  }

  AdjuntarArchivo(file, tipo: string) {
    return new Promise((resolve, reject) => {
      var formData = new FormData();
      var xhr = new XMLHttpRequest();

      formData.append('adjuntar', file, file.name)
      formData.append('subProy', "Licitaciones")
      formData.append('Tipo', tipo)

      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(xhr.response);
          }
        }
      }

      xhr.open('POST', environment.node + 'adjuntarBitacora', true);
      xhr.send(formData);
    });
  }

  guardaComentario(Comentario) {
    // Enviar como application/x-www-form-urlencoded (mismo patrón que addHito)
    const params = new URLSearchParams();
    params.set('Comentario', String(Comentario?.Comentario ?? ''));
    params.set('IdLicitacion', String(Comentario?.IdLicitacion ?? ''));
    params.set('FechaCreacion', String(Comentario?.FechaCreacion ?? ''));
    params.set('IdUsuarioCreador', String(Comentario?.IdUsuarioCreador ?? ''));
    params.set('Activo', String(Comentario?.Activo ?? ''));
    if (Comentario?.ArchivoAdjunto) {
      params.set('ArchivoAdjunto', String(Comentario.ArchivoAdjunto));
    }

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };

    this.http.post<any>(environment.urlBase + "comentarios/", params, { headers }).subscribe({
      next: (res) => {
        // this.msg = "";
        // this.Mensaje();
        this.OcultaOferta = false;
        this.Loading[2] = false;
        this.cargandoLic = true;
        Swal.fire(
          'Bitacora',
          'Se ha cargado la bitacora',
          'success'
        )
        this.btnBitacoraDis = false;
        // Recargar la lista de bitácoras
        if (this.listaBitacoraComponent) {
          this.listaBitacoraComponent.GetComentarios();
        }
      },
      error: (xhr) => {
        //this.GetMandnate();
        this.Loading[2] = false;
        this.btnBitacoraDis = false;
      }
    });
  }

  ValidaComentario() {
    if ($("#txtBitacora").val() == "" || $("#txtBitacora").val() === undefined || $("#txtBitacora").val() === null) {
      $("#txtBitacora").attr("class", "form-control error");
      this.errorComentario = "Debe ingresar valor";
      return false
    }
    return true
  }

  CleanComentario() {
    this.errorComentario = "";
    this.Clean("#txtBitacora");
  }

  NombreArchivo() {
    this.btnBitacoraDis = true;
    $("#NombreArch").html($("#fileupload1")[0].files[0].name);
    this.btnBitacoraDis = false;
  }

  VerBitacora() {
    //e.preventDefault();
    this.route.navigate(['/Licitacion-Bitacora']);
  }

  //******************************************Tareas******************************************
  listarTareas() {
    let env = environment.urlBase;
    this.http.get<mTarea[]>(env + "pMis_Tareas/GetMis_TareasByIdUsuario/IdUsuario=" + this.usuario.idUsuario).subscribe((res: mTarea[]) => {
      // Filtrar tareas y mapear nombre del responsable y creador
      const tareasFiltradas = res.filter(el => el.nombreTarea == this.nomlic && el.idEstadoTarea < 3);
      this.Tareas = tareasFiltradas.map(tarea => {
        const responsable = this.coordinadores.find(c => c.idUsuario === tarea.idUsuarioResponsable);
        const nombreResponsable = responsable ? (responsable.nombre + ' ' + responsable.paterno) : '';
        let creadorNombre = '';
        const creador = this.coordinadores.find(c => c.idUsuario === tarea.idUsuarioCreador);
        creadorNombre = creador ? (creador.nombre + ' ' + creador.paterno) : tarea.idUsuarioCreador.toString();
        return {
          ...tarea,
          responsableNombre: nombreResponsable,
          creadorNombre
        };
      });
      this.LoadingTabla[3] = false;
    });
  }

  addTarea(tarea: mTarea) {
    tarea.nombreTarea = this.nomlic;
    this.http.post(environment.urlBFF + "tarea", tarea).subscribe(res => {
      console.log("Tarea Agregada");
      this.listarTareas();
    });
  }

  //******************************************Generales******************************************

  Mensaje() {
    $("#Mensaje").attr('class', 'modal fade in');
    $("#Mensaje").attr("style", "display: block;background-color:rgba(0, 0, 0, 0.5);overflow-y: scroll;");
    $("body").attr("style", "overflow-y: hidden;");
  }

  MensajeError() {
    $("#MensajeError").attr('class', 'modal fade in');
    $("#MensajeError").attr("style", "display: block;background-color:rgba(0, 0, 0, 0.5);overflow-y: scroll;");
    $("body").attr("style", "overflow-y: hidden;");
  }

  OcultarMensaje() {
    $("#Mensaje").attr('class', 'modal fade');
    $("#Mensaje").attr("style", "");
    $("body").attr("style", "");
  }

  OcultarMensajeError() {
    $("#MensajeError").attr('class', 'modal fade');
    $("#MensajeError").attr("style", "");
    $("body").attr("style", "");
  }

  Clean(control: string) {
    $(control).attr("class", "form-control")
  }


  uploadFile: any;
  hasBaseDropZoneOver: boolean = false;
  options: Object = {
    url: 'http://localhost:8081/Upload.php'
  };
  handleUpload(data): void {
    if (data && data.response) {
      data = JSON.parse(data.response);
      this.uploadFile = data;
    }
  }

  subirArchivo(file) {
    let formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    let pag = environment.urlBFF + "comentarios/"
    let loc = this;

    let imgPromise = this.getFileBlob(file);

    let Comentario

    imgPromise.then(blob => {
      Comentario = {
        Comentario: $("#txtBitacora").val(),
        IdLicitacion: this.Licitacion.idLicitacion,
        FechaCreacion: this.retFecha(this.Hoy),
        IdUsuarioCreador: this.usuario.idUsuario,
        Activo: 1,
        ArchivoAdjunto: blob
      }

      // console.log(Comentario);

      this.http.post<any>(pag, Comentario).subscribe({
        next: (result) => {
          loc.msg = "Se ha cargado el elemento";
          loc.Mensaje();
          //loc.GetMandnate();
          loc.OcultaOferta = false;
          loc.Loading[2] = false;
        },
        error: (xhr) => {
          //loc.GetMandnate();
          loc.Loading[2] = false;
        }
      });

      $("#txtBitacora").val("");
      $("#NombreArch").html("");
      $("#fileupload1")[0].value = "";

    }).catch(e => console.log(e));

    return imgPromise
  }

  getFileBlob(file) {

    var reader = new FileReader();
    return new Promise(function (resolve, reject) {
      reader.onload = (function (theFile) {
        return function (e) {
          resolve(e.target.result);
        };
      })(file);
      reader.readAsDataURL(file);
    });

  }

  // Obtener lista de coordinadores para mapear nombres
  obtenerCoordinadores() {
    this.coordinadoresService.getVis_UsuariosCoordinadores().subscribe(
      coordinadores => {
        this.coordinadores = coordinadores;
        if (this.Tareas && this.Tareas.length > 0) {
          this.Tareas = this.Tareas.map(tarea => {
            const responsable = coordinadores.find(c => c.idUsuario === tarea.idUsuarioResponsable);
            const nombreResponsable = responsable ? (responsable.nombre + ' ' + responsable.paterno) : '';
            return { ...tarea, responsableNombre: nombreResponsable };
          });
        }
      },
      error => {
        console.error('Error al obtener coordinadores:', error);
      }
    );
  }

  getEstadoColor(estadoNombre: string): { bg: string; color: string } {
    if (!this.Estados || !estadoNombre) return { bg: '', color: '' };
    const estado = this.Estados.find(e => e.NombreEstado === estadoNombre);
    if (estado && estado.color && estado.textColor) {
      return { bg: estado.color, color: estado.textColor };
    }
    // Colores por defecto para otros estados
    switch (estadoNombre) {
      case 'Factibilidad': return { bg: '#e3f2fd', color: '#1976d2' };
      case 'Pendiente': return { bg: '#fffde7', color: '#fbc02d' };
      case 'Entregada': return { bg: '#e8f5e9', color: '#388e3c' };
      case 'Estudio': return { bg: '#f3e5f5', color: '#7b1fa2' };
      case 'Aclaraciones': return { bg: '#fce4ec', color: '#d81b60' };
      case 'Adjudicada': return { bg: '#e0f2f1', color: '#00897b' };
      case 'Perdida': return { bg: '#ffebee', color: '#c62828' };
      case 'Postergada': return { bg: '#fbe9e7', color: '#d84315' };
      case 'Carta Excusa': return { bg: '#ede7f6', color: '#5e35b1' };
      case 'Anulada': return { bg: '#f5f5f5', color: '#616161' };
      default: return { bg: '', color: '' };
    }
  }

}
