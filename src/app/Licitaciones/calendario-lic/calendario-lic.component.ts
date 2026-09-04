import { Component, OnInit } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MainComponent } from '../../main/main.component';
import { LicitacionFechaHitoService } from '../../services/licitacion-fecha-hito.service';
import { LicitacionHoraService } from '../../services/licitacion-hora.service';

declare var jQuery: any;
declare var $: any;

interface LicitacionCalendario {
  IdHitoLicitacion: number;
  Descripcion: string;
  NombreHito: string;
  NombreMandante: string;
  NombreEjecutivo: string;
  backgroundColor: string;
  textColor?: string;
  title?: string;
  FechaCompromiso?: string;
  HoraCompromiso?: string;
  Estado?: string;
}

interface CalendarEventRecord {
  IdHitoLicitacion?: number;
  id?: number | string;
  title?: string;
  NombreHito?: string;
  Descripcion?: string;
  NombreMandante?: string;
  NombreEjecutivo?: string;
  start?: string | Date;
  end?: string | Date;
  color?: string;
  backgroundColor?: string;
  HoraCompromiso?: string;
}

interface HitoLicitacion {
  IdLicitacion: number;
  IdHito?: number;
  NombreLicitacion?: string;
  DescripcionLicitacion?: string;
  FechaCompromiso?: string;
  HoraCompromiso?: string;
}

interface Hito {
  IdHito: number;
  NombreHito: string;
  ColorCalendario: string;
  MostrarEnCalendario: boolean;
}

@Component({
  selector: 'app-calendario-lic',
  standalone: true,
  imports: [CommonModule, DatePipe, MainComponent],
  templateUrl: './calendario-lic.component.html',
  styleUrls: ['./calendario-lic.component.css'],
  providers: [DatePipe]
})
export class CalendarioLicComponent implements OnInit {

  Fecha: string = '';
  fechaEdit: Date;
  selectedDate: Date | null = null;  // Hacer público para el template
  private calendar: any;
  private loadingDateData = false; // Prevenir llamadas duplicadas
  private hitoColorMap: Map<string, string> = new Map(); // Mapa de nombre de hito a color

  constructor(
    private http: HttpClient,
    private licitacionFechaHitoService: LicitacionFechaHitoService,
    private licitacionHoraService: LicitacionHoraService
  ) { }

  ngOnInit() {
    // Primero cargar los colores de los hitos, luego inicializar el calendario
    this.loadHitoColorsAndInitialize();
  }

  private initializeComponent() {
    // Inicializar fecha
    this.fechaEdit = new Date();
    this.Fecha = new Date().toString();

    // Cargar scripts necesarios
    this.loadExternalScripts();

    // Esperar a que los elementos DOM estén disponibles
    setTimeout(() => {
      this.waitForDOMAndInitialize();
    }, 100);
  }

  private waitForDOMAndInitialize() {
    // Verificar que el elemento calendario existe
    const calendarElement = document.getElementById('calendar');
    if (!calendarElement) {
      console.log('Calendar element not ready, retrying...');
      setTimeout(() => this.waitForDOMAndInitialize(), 200);
      return;
    }

    // Verificar que jQuery esté disponible
    if (typeof $ === 'undefined') {
      console.log('jQuery not ready, retrying...');
      setTimeout(() => this.waitForDOMAndInitialize(), 200);
      return;
    }

    // Todo listo, inicializar calendario
    console.log('DOM and jQuery ready, initializing calendar...');
    this.initializeCalendar();
  }

  private loadExternalScripts() {
    if (typeof $ !== 'undefined') {
      try {
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js").catch((error: any) => {
          console.warn('Settings script not available:', error);
        });
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js").catch((error: any) => {
          console.warn('App script not available:', error);
        });
      } catch (error) {
        console.warn('Error loading external scripts:', error);
      }
    }
  }

  private initializeCalendar() {
    // Verificar que jQuery y FullCalendar estén disponibles
    if (typeof $ === 'undefined') {
      console.error('jQuery not available');
      return;
    }

    if (typeof $.fn.fullCalendar === 'undefined') {
      console.error('FullCalendar not available');
      setTimeout(() => this.initializeCalendar(), 1000);
      return;
    }

    const component = this;
    
    // Configurar eventos arrastables
    this.setupDraggableEvents();

    console.log('Initializing calendar...');

    // Cargar eventos del calendario
    this.http.get<any[]>("http://trazas-nbi.com:1234/api/Calendario/").subscribe({
      next: async (data) => {
        console.log('Calendar data loaded:', data);
        const normalizedData = await this.enrichCalendarEventNames(this.normalizeCalendarEvents(data));
        // Aplicar colores correctos de los hitos
        normalizedData.forEach(event => {
          const hitoColor = this.resolveHitoColor(event.title || event.NombreHito);
          if (hitoColor) {
            event.backgroundColor = hitoColor;
            event.color = hitoColor;
          }
        });
        // Eliminar hitos duplicados reales usando los campos visibles del evento
        const eventsWithDate = normalizedData.filter(event => this.normalizeFechaIso(event.start) !== '');
        const uniqueData = this.removeDuplicateHitos(eventsWithDate);
        console.log('Unique calendar data:', uniqueData);
        // Filtrar eventos obsoletos: el backend no borra los registros antiguos
        // cuando se cambia la fecha de un hito, por lo que el hito aparece en la
        // fecha vieja y en la nueva. Se cruza con el endpoint de hitos de cada
        // licitación para quedarse solo con la fecha vigente (mayor IdHitoLicitacion).
        this.filterOutdatedHitoEvents(uniqueData).then(filtered => {
          console.log('Calendar data después de filtrar fechas obsoletas:', filtered.length);
          this.createFullCalendar(filtered, component);
          this.setupCalendarControls();
        }).catch(() => {
          // Si falla la consulta de hitos, mostrar lo que hay (mejor duplicado que vacío)
          this.createFullCalendar(uniqueData, component);
          this.setupCalendarControls();
        });
      },
      error: (error) => {
        console.error('Error loading calendar data:', error);
        // Crear calendario vacío en caso de error
        this.createFullCalendar([], component);
        this.setupCalendarControls();
      }
    });
  }

  // Filtra los eventos del calendario mensual ocultando los hitos que fueron
  // MOVIDOS a otra fecha. La única fuente confiable de movimientos es Firestore
  // (colección hitosHora): se escribe cada vez que el usuario edita la fecha en
  // /Licitacion-Detalle. El backend NO es confiable para esto porque acumula un
  // registro por cada acción (incluye huérfanos y fechas corruptas).
  // Regla: si Firestore tiene una fecha vigente distinta a la del evento, el
  // evento es un huérfano de una edición anterior -> se oculta. Si no hay dato
  // en Firestore, el hito nunca se movió con este sistema -> se muestra donde el
  // backend lo reporta.
  private async filterOutdatedHitoEvents(events: any[]): Promise<any[]> {
    // Extraer IDs de licitación desde el título. Formatos reales:
    // "573:Adjudicación", "12a 573:Adjudicación" -> licitación 573
    const licitacionIds = new Set<number>();
    events.forEach(e => {
      const m = String(e.title || e.NombreHito || '').match(/(\d+)\s*:/);
      if (m) licitacionIds.add(Number(m[1]));
    });
    if (licitacionIds.size === 0) return events;

    // 1) Fechas vigentes confirmadas desde Firestore: "licitacionId_idHito" -> fecha
    let fechasFirestore: Record<string, string> = {};
    try {
      fechasFirestore = await this.licitacionFechaHitoService.obtenerTodasLasFechas();
      console.log('[CAL] Fechas vigentes desde Firestore:', Object.keys(fechasFirestore).length, fechasFirestore);
    } catch (err) {
      console.warn('[CAL] No se pudieron leer fechas de Firestore, no se ocultan movimientos', err);
      return events; // sin fuente de verdad no se puede ocultar nada con certeza
    }
    const firestoreKeys = Object.keys(fechasFirestore);
    if (firestoreKeys.length === 0) return events;

    // 2) Mapear nombre de hito -> IdHito por licitación (para cruzar el título
    // del evento con la clave de Firestore). No se usa para ocultar por fecha.
    const entries = await Promise.all([...licitacionIds].map(async (id) => {
      try {
        const hitos = await this.http.get<any[]>(
          `http://trazas-nbi.com:1234/api/Licitaciones/GetHitosHitosLicitacionByLicitaciones/IdLicitacion=${id}`
        ).toPromise();
        return [id, hitos || []] as [number, any[]];
      } catch {
        return [id, []] as [number, any[]];
      }
    }));

    // Mapa: licitacionId:nombreHito(normalizado) -> fecha vigente (solo de Firestore).
    // Una cadena vacía significa que el hito fue dejado sin fecha y debe ocultarse.
    const vigente = new Map<string, string>();
    for (const [licId, hitos] of entries) {
      const idHitoPorNombre = new Map<string, number>();
      for (const h of hitos) {
        const key = this.normalizeTextKey(h?.NombreHito);
        const idHito = Number(h?.IdHito || 0);
        if (key && idHito && !idHitoPorNombre.has(key)) {
          idHitoPorNombre.set(key, idHito);
        }
      }
      idHitoPorNombre.forEach((idHito, key) => {
        const fechaFs = fechasFirestore[`${licId}_${idHito}`];
        if (Object.prototype.hasOwnProperty.call(fechasFirestore, `${licId}_${idHito}`)) {
          vigente.set(`${licId}:${key}`, fechaFs);
        }
      });
    }

    // Filtrar eventos: ocultar solo si Firestore confirma que el hito quedó
    // vigente en otra fecha.
    const filtered = events.filter(e => {
      const title = String(e.title || e.NombreHito || '');
      // Aceptar prefijos como "12a 573:Adjudicación": tomar el número antes de ':'
      const m = title.match(/(\d+)\s*:\s*(.+)$/);
      if (!m) return true; // sin formato "id:nombre" no se puede validar -> mostrar
      const licId = Number(m[1]);
      const hitoName = this.normalizeTextKey(m[2]);
      const key = `${licId}:${hitoName}`;
      if (!vigente.has(key)) return true; // sin movimiento confirmado -> mostrar
      const fechaEvento = this.normalizeFechaIso(e.start);
      const fechaVigente = vigente.get(key);
      const ok = fechaEvento === fechaVigente;
      if (!ok) {
        console.log(`[CAL][obsoleto] ocultando "${title}" del ${fechaEvento} (vigente: ${fechaVigente})`);
      }
      return ok;
    });

    console.log(`[CAL] Filtro de fechas obsoletas: ${events.length} eventos -> ${filtered.length} tras filtrar`);
    return filtered;
  }

  // Normaliza una fecha (string ISO o Date) a yyyy-MM-dd; '' si no es válida.
  private normalizeFechaIso(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? '' : this.formatDateForCalendar(value);
    }
    const d = this.normalizeApiDateValue(String(value));
    if (d instanceof Date) {
      return isNaN(d.getTime()) ? '' : this.formatDateForCalendar(d);
    }
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
  }

  // Filtra la vista diaria: colapsa duplicados del mismo hito en el día
  // conservando el más reciente, Y oculta los hitos que Firestore confirma que
  // fueron movidos a OTRA fecha (huérfanos de ediciones anteriores que el
  // backend sigue devolviendo en la fecha vieja). Sin dato en Firestore, el hito
  // se muestra donde el endpoint diario lo reporta (colapsando duplicados).
  private async filterOutdatedDaily(data: LicitacionCalendario[], diaYmd: string): Promise<LicitacionCalendario[]> {
    if (!data || data.length === 0) return data;

    // Fechas vigentes confirmadas desde Firestore (se escriben al editar la fecha)
    let fechasFs: Record<string, string> = {};
    try {
      fechasFs = await this.licitacionFechaHitoService.obtenerTodasLasFechas();
    } catch { /* sin Firestore no se oculta nada */ }

    // Para cada registro necesitamos idLicitacion e idHito (el endpoint diario no
    // los trae). Los obtenemos del endpoint HitosLicitacion/{id}.
    const enriched = await Promise.all(data.map(async (lic) => {
      try {
        const h = await this.http.get<any>(
          `http://trazas-nbi.com:1234/api/HitosLicitacion/${lic.IdHitoLicitacion}`
        ).toPromise();
        return { lic, idLicitacion: Number(h?.IdLicitacion || 0), idHito: Number(h?.IdHito || 0) };
      } catch {
        return { lic, idLicitacion: 0, idHito: 0 };
      }
    }));

    // Agrupar por hito (licitacion+hito si se conoce, si no por nombre+descripción)
    const grupos = new Map<string, { lic: LicitacionCalendario; idLicitacion: number; idHito: number }[]>();
    enriched.forEach(e => {
      const key = (e.idLicitacion && e.idHito)
        // El nombre también forma parte de la clave: algunos registros del
        // endpoint pueden compartir IdHito aunque sean hitos visibles distintos.
        ? `${e.idLicitacion}_${e.idHito}_${this.normalizeTextKey(e.lic.NombreHito)}`
        : `nombre:${this.normalizeTextKey(e.lic.NombreHito)}|${this.normalizeTextKey(e.lic.Descripcion)}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(e);
    });

    const resultado: LicitacionCalendario[] = [];
    for (const [key, grupo] of grupos) {
      const { idLicitacion, idHito } = grupo[0];

      // Ocultar SOLO si Firestore confirma que el hito fue movido a otro día.
      const fechaVigenteFs = (idLicitacion && idHito) ? fechasFs[`${idLicitacion}_${idHito}`] : undefined;
      if (Object.prototype.hasOwnProperty.call(fechasFs, `${idLicitacion}_${idHito}`) && fechaVigenteFs !== diaYmd) {
        console.log(`[CAL][diario] ocultando hito ${key}: fue movido a ${fechaVigenteFs}, no ${diaYmd}`);
        continue;
      }

      // Este día (o sin confirmación de movimiento): conservar el registro más
      // reciente del grupo (colapsa duplicados del mismo hito en este día).
      const reciente = [...grupo].sort((a, b) =>
        Number(b.lic.IdHitoLicitacion || 0) - Number(a.lic.IdHitoLicitacion || 0))[0];
      resultado.push(reciente.lic);
    }

    return resultado;
  }

  private setupDraggableEvents() {
    if (typeof $ === 'undefined') return;

    $('#external-events').find('div.external-event').each(function () {
      const eventObject = {
        title: $.trim($(this).text())
      };

      $(this).data('eventObject', eventObject);

      $(this).draggable({
        zIndex: 999,
        revert: true,
        revertDuration: 0
      });
    });
  }

  private createFullCalendar(data: any[], component: CalendarioLicComponent) {
    if (typeof $ === 'undefined' || typeof $.fn.fullCalendar === 'undefined') {
      console.error('FullCalendar not available');
      return;
    }

    console.log('Creating FullCalendar with data:', data);

    // Asegurar que el elemento calendario existe
    const calendarElement = $('#calendar');
    if (calendarElement.length === 0) {
      console.error('Calendar element not found');
      return;
    }

    try {
      this.calendar = calendarElement.fullCalendar({
        header: {
          left: '',
          center: '',
          right: ''
        },
        locale: 'es',
        timezone: 'local',
        firstDay: 1, // Comenzar la semana en lunes
        weekNumbers: false,
        selectable: true,
        selectHelper: true,
        editable: true,
        droppable: true,
        events: data,
        dayClick: function(date: any, jsEvent: any, view: any) {
          console.log('Day clicked (moment):', date);
          // Crear fecha correcta sin conversión de timezone
          const clickedDate = new Date(date.year(), date.month(), date.date());
          console.log('Day clicked (converted):', clickedDate);
          console.log('Day name should be:', clickedDate.toLocaleDateString('es-ES', { weekday: 'long' }));
          component.onDateSelected(clickedDate);
        },
        select: function(start: any, end: any, allDay: boolean) {
          console.log('Date range selected:', start, end);
          const selectedDate = new Date(start.year(), start.month(), start.date());
          console.log('Range selected (converted):', selectedDate);
          component.onDateSelected(selectedDate);
        },
        eventClick: function(event: any) {
          console.log('Event clicked:', event);
          if (event.start) {
            const eventDate = new Date(event.start.year(), event.start.month(), event.start.date());
            console.log('Event date (converted):', eventDate);
            component.onDateSelected(eventDate);
          }
        },
        drop: function(date: any, allDay: boolean) {
          component.handleEventDrop.call(this, date, allDay);
        }
      });

      console.log('FullCalendar created successfully');
    } catch (error) {
      console.error('Error creating FullCalendar:', error);
    }
  }

  private loadHitoColorsAndInitialize() {
    this.http.get<Hito[]>("http://trazas-nbi.com:1234/api/Hitos").subscribe({
      next: (hitos) => {
        console.log('Hitos loaded for color mapping:', hitos.length);
        hitos.forEach(hito => {
          if (hito.NombreHito && hito.ColorCalendario) {
            this.hitoColorMap.set(hito.NombreHito.trim(), hito.ColorCalendario);
            console.log(`Mapped hito: "${hito.NombreHito}" -> ${hito.ColorCalendario}`);
          }
        });
        console.log('Total hito colors mapped:', this.hitoColorMap.size);
        // Ahora que tenemos los colores, inicializar el calendario
        this.initializeComponent();
      },
      error: (error) => {
        console.error('Error loading hito colors:', error);
        // Inicializar de todos modos aunque falle la carga de colores
        this.initializeComponent();
      }
    });
  }

  private onDateSelected(selectedDate: Date) {
    console.log('Processing date selection:', selectedDate);
    console.log('Selected date details:', {
      date: selectedDate,
      day: selectedDate.getDate(),
      month: selectedDate.getMonth() + 1,
      year: selectedDate.getFullYear(),
      dayName: selectedDate.toLocaleDateString('es-ES', { weekday: 'long' }),
      fullDate: selectedDate.toLocaleDateString('es-ES')
    });
    
    if (!selectedDate || !(selectedDate instanceof Date)) {
      console.error('Invalid date selected:', selectedDate);
      return;
    }

    // Prevenir llamadas duplicadas para la misma fecha
    if (this.loadingDateData) {
      console.log('Ya se está cargando datos para esta fecha, ignorando llamada duplicada');
      return;
    }

    this.selectedDate = selectedDate;
    this.loadingDateData = true;
    
    // Resaltar el día seleccionado visualmente
    this.highlightSelectedDay(selectedDate);
    
    // Mostrar mensaje de carga
    this.showLoadingMessage();
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    
    const url = `http://trazas-nbi.com:1234/api/Calendario/GetCalendarioDiario/Fecha=${year}-${month}-${day}`;
    console.log('Fetching data from:', url);
    
    this.http.get<LicitacionCalendario[]>(url).subscribe({
      next: async (dataDia) => {
        console.log('Daily calendar data loaded:', dataDia);
        // Aplicar colores correctos de los hitos
        dataDia.forEach(lic => {
          const hitoColor = this.resolveHitoColor(lic.NombreHito);
          if (hitoColor) {
            lic.backgroundColor = hitoColor;
          }
        });
        // Filtrar registros obsoletos: el backend acumula un registro por cada
        // edición y el endpoint diario los devuelve todos. filterOutdatedDaily
        // ya conserva, para cada hito, solo el registro vigente (o el más
        // reciente), por lo que NO se aplica removeDuplicateLicitaciones aquí:
        // ese filtro colapsaba hitos DISTINTOS que caen el mismo día cuando
        // comparten mandante/ejecutivo/descripción (ej. Consultas, General y
        // Pres_Propuesta del mismo día), mostrando solo uno.
        const uniqueData = await this.filterOutdatedDaily(dataDia, `${year}-${month}-${day}`);
        console.log('Unique daily data:', uniqueData);
        this.displayLicitacionDetails(uniqueData);
        this.loadingDateData = false;
      },
      error: (error) => {
        console.error('Error loading daily calendar data:', error);
        this.showErrorMessage();
        this.loadingDateData = false;
      }
    });
  }

  private highlightSelectedDay(selectedDate: Date) {
    if (typeof $ === 'undefined') return;

    // Remover selección previa
    $('.fc-day').removeClass('selected-day');
    
    // Encontrar y resaltar el día seleccionado
    const dateString = this.formatDateForCalendar(selectedDate);
    const dayElement = $(`.fc-day[data-date="${dateString}"]`);
    
    if (dayElement.length > 0) {
      dayElement.addClass('selected-day');
    } else {
      // Fallback: buscar por contenido del día
      $('.fc-day').each(function() {
        const dayNumber = $(this).find('.fc-day-number').text();
        if (parseInt(dayNumber) === selectedDate.getDate()) {
          $(this).addClass('selected-day');
        }
      });
    }
  }

  private formatDateForCalendar(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private showLoadingMessage() {
    const container = document.getElementById('licitaciones-details');
    if (!container) return;

    container.innerHTML = `
      <div class="loading-message text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Cargando...</span>
        </div>
        <p class="text-muted mt-3">Cargando información de licitaciones...</p>
      </div>
    `;
  }

  private async displayLicitacionDetails(licitaciones: LicitacionCalendario[]) {
    const detailsContainer = document.getElementById('licitaciones-details');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = '';

    if (licitaciones.length === 0) {
      this.showNoLicitationsMessage(detailsContainer);
      return;
    }

    this.createDateHeader(detailsContainer);

    for (let i = 0; i < licitaciones.length; i++) {
      try {
        const hitoData = await this.getHitoLicitacion(licitaciones[i].IdHitoLicitacion);
        const horaFirestore = hitoData?.IdLicitacion && hitoData?.IdHito
          ? await this.obtenerHoraHitoDesdeFirestore(hitoData.IdLicitacion, hitoData.IdHito)
          : null;

        if (horaFirestore) {
          licitaciones[i].HoraCompromiso = horaFirestore;
          if (hitoData) {
            hitoData.HoraCompromiso = horaFirestore;
          }
        }

        this.createLicitacionCard(detailsContainer, licitaciones[i], hitoData);
      } catch (error) {
        console.error('Error loading hito data:', error);
        this.createLicitacionCard(detailsContainer, licitaciones[i], null);
      }
    }
  }

  private async obtenerHoraHitoDesdeFirestore(idLicitacion: number, idHito: number): Promise<string | null> {
    try {
      const horas = await this.licitacionHoraService.obtenerHorasHitos(idLicitacion);
      return horas[Number(idHito)] || null;
    } catch (error) {
      console.warn('No se pudo leer la hora del hito desde Firestore', error);
      return null;
    }
  }

  private getHitoLicitacion(idHito: number): Promise<HitoLicitacion> {
    return this.http.get<HitoLicitacion>(`http://trazas-nbi.com:1234/api/HitosLicitacion/${idHito}`).toPromise();
  }

  private createDateHeader(container: HTMLElement) {
    if (!this.selectedDate) return;

    const header = document.createElement('div');
    header.className = 'selected-date-header mb-3';
    header.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="fa fa-calendar text-primary mr-2"></i>
        <h5 class="mb-0">${this.formatSelectedDate()}</h5>
      </div>
      <hr class="my-2">
    `;
    container.appendChild(header);
  }

  private formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return this.selectedDate.toLocaleDateString('es-ES', options);
  }

  private formatHoraCompromiso(hora?: string): string {
    if (!hora) return '';
    const clean = String(hora).trim();
    if (!clean) return '';

    const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }

    const timeMatch = clean.match(/T?(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }

    return clean;
  }

  private formatFechaCompromisoForCard(licitacion: LicitacionCalendario, hitoData?: HitoLicitacion | null): string {
    const rawDate = (hitoData?.FechaCompromiso || licitacion.FechaCompromiso || (this.selectedDate ? this.formatDateForCalendar(this.selectedDate) : null));
    if (!rawDate) {
      return this.formatSelectedDate();
    }

    try {
      const dateOnly = String(rawDate).split('T')[0];
      const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      let parsed: Date | null = null;

      if (match) {
        const [, year, month, day] = match;
        parsed = new Date(Number(year), Number(month) - 1, Number(day));
      } else if (typeof rawDate === 'string') {
        parsed = new Date(rawDate);
      }

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };

      const formattedDate = parsed && !isNaN(parsed.getTime())
        ? parsed.toLocaleDateString('es-ES', options)
        : this.formatSelectedDate();

      const horaFromDate = typeof rawDate === 'string'
        ? this.formatHoraCompromiso(rawDate.includes('T') ? rawDate.split('T')[1].split('.')[0] : '')
        : '';

      const hora = this.formatHoraCompromiso(hitoData?.HoraCompromiso || licitacion.HoraCompromiso) || horaFromDate;
      return hora ? `${formattedDate}, ${hora}` : formattedDate;
    } catch {
      return this.formatSelectedDate();
    }
  }

  private createLicitacionCard(container: HTMLElement, licitacion: LicitacionCalendario, hitoData: HitoLicitacion | null) {
    const cardWrapper = document.createElement('div');
    // Si el estado es Terminado, usar rosa pastel en lugar de gris
    let backgroundColor = licitacion.backgroundColor || '#6c757d';
    if (licitacion.Estado === 'Terminado' && this.isGrayColor(backgroundColor)) {
      backgroundColor = '#f8b4d9'; // Rosa pastel para hitos terminados
    }
    const textColor = licitacion.textColor || '#fff';
    
    // Generar ID único para esta tarjeta
    const cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cardWrapper.className = `licitacion-card-wrapper mb-4`;
    cardWrapper.id = cardId;

    // Aplicar estilos dinámicos basados en el color del calendario
    const lighterBg = this.hexToRgba(backgroundColor, 0.08);  // Más sutil
    const mediumBg = this.hexToRgba(backgroundColor, 0.15);   // Para elementos secundarios
    const solidBg = this.hexToRgba(backgroundColor, 0.9);     // Fondo sólido para header
    const borderColor = this.hexToRgba(backgroundColor, 0.3); // Color para bordes

    cardWrapper.innerHTML = `
      <div class="card shadow-sm border-0" style="border-left: 5px solid ${backgroundColor} !important; overflow: hidden;">
        <!-- Header con color principal -->
        <div class="card-header" style="background: linear-gradient(135deg, ${solidBg} 0%, ${backgroundColor} 100%); color: white; border: none; padding: 1.25rem;">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <div class="header-icon me-3" style="background: rgba(255,255,255,0.2); color: white; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <i class="fa fa-calendar-check fa-lg"></i>
              </div>
              <div>
                <h5 class="card-title mb-1" style="color: white; font-weight: 600; font-size: 1.1rem;">${licitacion.Descripcion || 'Sin descripción'}</h5>
                ${hitoData?.IdLicitacion ? `<small style="color: rgba(255,255,255,0.9); font-weight: 500;">
                  <i class="fa fa-hashtag"></i> ID: ${hitoData.IdLicitacion}
                </small>` : ''}
              </div>
            </div>
            <div class="hito-badge" style="background: rgba(255,255,255,0.15); color: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500; border: 1px solid rgba(255,255,255,0.2);">
              ${licitacion.NombreHito}
            </div>
          </div>
        </div>

        <!-- Cuerpo de la tarjeta -->
        <div class="card-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, ${lighterBg} 100%);">
          <div class="row g-3">
            <!-- Hito -->
            <div class="col-12">
              <div class="info-item p-3 rounded-3" style="background: white; border: 1px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper mr-3" style="background: ${backgroundColor}; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="fa fa-flag"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="label" style="color: #6c757d; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hito</div>
                    <div class="value" style="color: #2d3748; font-weight: 500; font-size: 0.95rem; margin-top: 2px;">${licitacion.NombreHito}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fecha y hora -->
            <div class="col-12">
              <div class="info-item p-3 rounded-3" style="background: white; border: 1px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper mr-3" style="background: ${backgroundColor}; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="fa fa-calendar"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="label" style="color: #6c757d; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Fecha y hora</div>
                    <div class="value" style="color: #2d3748; font-weight: 500; font-size: 0.95rem; margin-top: 2px;">${this.formatFechaCompromisoForCard(licitacion, hitoData)}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mandante -->
            <div class="col-12">
              <div class="info-item p-3 rounded-3" style="background: white; border: 1px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper mr-3" style="background: ${backgroundColor}; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="fa fa-building"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="label" style="color: #6c757d; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Mandante</div>
                    <div class="value" style="color: #2d3748; font-weight: 500; font-size: 0.95rem; margin-top: 2px;">${licitacion.NombreMandante}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ejecutivo -->
            <div class="col-12">
              <div class="info-item p-3 rounded-3" style="background: white; border: 1px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper mr-3" style="background: ${backgroundColor}; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="fa fa-user"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="label" style="color: #6c757d; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ejecutivo</div>
                    <div class="value" style="color: #2d3748; font-weight: 500; font-size: 0.95rem; margin-top: 2px;">${licitacion.NombreEjecutivo}</div>
                  </div>
                </div>
              </div>
            </div>

            ${hitoData?.NombreLicitacion ? `
            <!-- Licitación -->
            <div class="col-12">
              <div class="info-item p-3 rounded-3" style="background: white; border: 1px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div class="d-flex align-items-start">
                  <div class="icon-wrapper mr-3" style="background: ${backgroundColor}; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="fa fa-file-text"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="label" style="color: #6c757d; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Licitación</div>
                    <div class="value" style="color: #2d3748; font-weight: 500; font-size: 0.95rem; margin-top: 2px; line-height: 1.4;">${hitoData.NombreLicitacion}</div>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}
            
            ${hitoData?.DescripcionLicitacion ? `
            <!-- Descripción -->
            <div class="col-12">
              <div class="info-item p-3 rounded-3" style="background: white; border: 1px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div class="d-flex align-items-start">
                  <div class="icon-wrapper mr-3" style="background: ${backgroundColor}; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="fa fa-info-circle"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="label" style="color: #6c757d; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Descripción</div>
                    <div class="value" style="color: #2d3748; font-weight: 400; font-size: 0.9rem; margin-top: 2px; line-height: 1.5;">${hitoData.DescripcionLicitacion}</div>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Footer -->
        <div class="card-footer text-center" style="background: ${mediumBg}; border-top: 1px solid ${borderColor}; padding: 1rem;">
          <small style="color: #6c757d; font-weight: 500;">
            <i class="fa fa-clock-o mr-1" style="color: ${backgroundColor};"></i>
            Fecha y hora programada: <span style="font-weight: 600;">${this.formatFechaCompromisoForCard(licitacion, hitoData)}</span>
          </small>
        </div>
      </div>
    `;

    container.appendChild(cardWrapper);
  }

  // Función auxiliar para convertir hex a rgba
  private hexToRgba(hex: string, alpha: number): string {
    // Remover el # si existe
    hex = hex.replace('#', '');
    
    // Expandir notación corta (ej: #fff -> #ffffff)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private showNoLicitationsMessage(container: HTMLElement) {
    container.innerHTML = `
      <div class="no-selection-message">
        <div class="text-center py-4">
          <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
          <h6 class="text-muted">No hay licitaciones programadas</h6>
          <p class="text-muted small">Para la fecha seleccionada: ${this.formatSelectedDate()}</p>
        </div>
      </div>
    `;
  }

  private showErrorMessage() {
    const container = document.getElementById('licitaciones-details');
    if (!container) return;

    container.innerHTML = `
      <div class="no-selection-message">
        <div class="text-center py-4">
          <i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
          <h6 class="text-warning">Error al cargar información</h6>
          <p class="text-muted small">No se pudo cargar la información de las licitaciones</p>
        </div>
      </div>
    `;
  }

  private setupCalendarControls() {
    if (typeof $ === 'undefined' || !this.calendar) return;

    const component = this;

    // Configurar switcher de vista (oculto por defecto)
    $("#calendar-switcher").find("label").click(function () {
      const view = $(this).find('input').val();
      component.calendar.fullCalendar('changeView', view);
    });

    // Configurar botones de navegación
    $('#calender-prev').off('click').on('click', () => {
      this.Fecha = this.RetFecha(-1);
      this.calendar.fullCalendar('prev');
      this.updateDateDisplay();
    });

    $('#calender-next').off('click').on('click', () => {
      this.Fecha = this.RetFecha(1);
      this.calendar.fullCalendar('next');
      this.updateDateDisplay();
    });

    // Actualizar display inicial
    this.updateDateDisplay();
  }

  private updateDateDisplay() {
    if (!this.calendar) return;

    const currentDate = this.calendar.fullCalendar('getDate');
    this.Fecha = currentDate.toString();
  }

  private handleEventDrop(date: Date, allDay: boolean) {
    if (typeof $ === 'undefined') return;

    const originalEventObject = $(this).data('eventObject');
    const copiedEventObject = $.extend({}, originalEventObject);

    copiedEventObject.start = date;
    copiedEventObject.allDay = allDay;

    const $categoryClass = $(this).data('event-class');
    if ($categoryClass) {
      copiedEventObject['className'] = [$categoryClass];
    }

    $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
    $(this).remove();
  }

  RetFecha(val: number): string {
    if (!this.fechaEdit) {
      this.fechaEdit = new Date();
    }
    return this.fechaEdit.setMonth(this.fechaEdit.getMonth() + val).toString();
  }

  ViewWidgets() {
    // Método legacy - puede ser removido si no se usa
    console.log('ViewWidgets called - legacy method');
  }

  // Método de prueba para testing
  testDateSelection() {
    console.log('Testing date selection...');
    const today = new Date();
    this.onDateSelected(today);
  }

  // Eliminar hitos duplicados basándose en el nombre del hito y fecha
  private removeDuplicateHitos(events: any[]): any[] {
    const eventMap = new Map<string, any[]>();

    console.log('=== INICIANDO FILTRADO DE DUPLICADOS ===');
    console.log('Total eventos recibidos:', events.length);

    // Agrupar eventos por contenido visible y fecha normalizada
    events.forEach(event => {
      const key = this.buildCalendarEventKey(event);

      if (!eventMap.has(key)) {
        eventMap.set(key, []);
      }
      eventMap.get(key)!.push(event);
    });

    const result: any[] = [];

    // Para cada grupo de eventos duplicados
    eventMap.forEach((group, key) => {
      if (group.length > 1) {
        console.log(`\nGrupo duplicado encontrado: "${key}"`);
        console.log('Total en grupo:', group.length);
        group.forEach((e, i) => {
          const color = e.backgroundColor || e.color;
          console.log(`  [${i}] Color: ${color}, EsGris: ${this.isGrayColor(color)}`);
        });
      }

      // Filtrar solo los que tienen color (no grises)
      const colored = group.filter(event => {
        const color = event.backgroundColor || event.color;
        return !this.isGrayColor(color);
      });

      // Si hay eventos con color, usar solo el PRIMERO
      if (colored.length > 0) {
        if (group.length > 1) {
          console.log(`  -> Usando evento con color. Total con color: ${colored.length}`);
        }
        result.push(colored[0]);
      } else {
        // Si todos son grises, mantener solo el primero
        if (group.length > 1) {
          console.log('  -> Todos son grises, usando el primero');
        }
        result.push(group[0]);
      }
    });

    console.log('\nTotal eventos después del filtrado:', result.length);
    console.log('=== FIN FILTRADO DE DUPLICADOS ===\n');

    return result;
  }

  // ID numérico del registro del evento (IdHitoLicitacion o id); 0 si no existe.
  private eventRecordId(event: any): number {
    const raw = event?.IdHitoLicitacion ?? event?.id ?? 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // Resuelve el color de un hito a partir del título del evento. Los títulos
  // vienen como "12a 573:Adjudicación" o "573:General", mientras que el mapa de
  // colores usa solo el nombre del hito ("Adjudicación"). Se extrae la parte
  // después del ':' y se intentan ambas variantes (completo y sin prefijo).
  private resolveHitoColor(rawTitle: string | undefined): string | undefined {
    const title = String(rawTitle || '').trim();
    if (!title) return undefined;

    const direct = this.hitoColorMap.get(title);
    if (direct) return direct;

    const colonIndex = title.indexOf(':');
    if (colonIndex >= 0) {
      const hitoName = title.substring(colonIndex + 1).trim();
      const byName = this.hitoColorMap.get(hitoName);
      if (byName) return byName;

      // Fallback: coincidencia por contención (nombres abreviados en el título,
      // ej. "Apelación Tec" vs "Apelación Tecnica").
      for (const [name, color] of this.hitoColorMap.entries()) {
        if (hitoName.length >= 4 && (name.startsWith(hitoName) || hitoName.startsWith(name))) {
          return color;
        }
      }
    }
    return undefined;
  }

  // Eliminar licitaciones duplicadas reales (para vista diaria)
  private removeDuplicateLicitaciones(licitaciones: LicitacionCalendario[]): LicitacionCalendario[] {
    const licitacionMap = new Map<string, LicitacionCalendario[]>();

    console.log('=== FILTRADO VISTA DIARIA ===');
    console.log('Total licitaciones recibidas:', licitaciones.length);
    console.log('TODAS las licitaciones recibidas:');
    licitaciones.forEach((lic, i) => {
      console.log(`  [${i}] Hito: "${lic.NombreHito}", Color: ${lic.backgroundColor}, Desc: ${lic.Descripcion}, ID: ${lic.IdHitoLicitacion}`);
    });

    // Agrupar por contenido visible de la tarjeta.
    licitaciones.forEach(lic => {
      const key = this.buildDailyLicitacionKey(lic);

      if (!licitacionMap.has(key)) {
        licitacionMap.set(key, []);
      }
      licitacionMap.get(key)!.push(lic);
    });

    const result: LicitacionCalendario[] = [];

    // Para cada grupo de licitaciones duplicadas
    licitacionMap.forEach((group, key) => {
      if (group.length > 1) {
        console.log(`\nHito duplicado: "${key}"`);
        console.log('Total duplicados:', group.length);
        group.forEach((lic, i) => {
          console.log(`  [${i}] Color: ${lic.backgroundColor}, EsGris: ${this.isGrayColor(lic.backgroundColor)}, Descripción: ${lic.Descripcion}`);
        });
      }

      // Primero, filtrar solo las que NO son grises
      const nonGray = group.filter(lic => {
        return !this.isGrayColor(lic.backgroundColor);
      });

      // Si hay al menos una no gris, usar solo la PRIMERA no gris
      if (nonGray.length > 0) {
        if (group.length > 1) {
          console.log(`  -> Usando licitación con color (no gris). Total con color: ${nonGray.length}, seleccionando la primera`);
        }
        result.push(nonGray[0]);
      } else {
        // Si todas son grises, mantener solo la primera
        if (group.length > 1) {
          console.log('  -> Todas son grises, usando la primera');
        }
        result.push(group[0]);
      }
    });

    console.log('\nTotal licitaciones después del filtrado:', result.length);
    console.log('=== FIN FILTRADO VISTA DIARIA ===\n');

    return result;
  }

  private async enrichCalendarEventNames(events: CalendarEventRecord[]): Promise<CalendarEventRecord[]> {
    const licitacionIds = new Set<number>();
    events.forEach(event => {
      const match = String(event.title || '').match(/(\d+)\s*:/);
      if (match) licitacionIds.add(Number(match[1]));
    });

    const entries = await Promise.all([...licitacionIds].map(async id => {
      try {
        const hitos = await this.http.get<any[]>(
          `http://trazas-nbi.com:1234/api/Licitaciones/GetHitosHitosLicitacionByLicitaciones/IdLicitacion=${id}`
        ).toPromise();
        return [id, hitos || []] as [number, any[]];
      } catch {
        return [id, []] as [number, any[]];
      }
    }));

    const hitosPorLicitacion = new Map<number, any[]>();
    entries.forEach(([id, hitos]) => hitosPorLicitacion.set(id, hitos));

    return events.map(event => {
      const title = String(event.title || '');
      const match = title.match(/^(.*?\d+)\s*:\s*(.*)$/);
      if (!match) return event;

      const licitacionId = Number(match[1].match(/\d+/)?.[0]);
      const fechaEvento = this.normalizeFechaIso(event.start);
      const candidatos = (hitosPorLicitacion.get(licitacionId) || [])
        .filter(hito => this.normalizeFechaIso(hito?.FechaCompromiso) === fechaEvento)
        .filter(hito => String(hito?.NombreHito || '').trim());

      if (candidatos.length === 0) return event;

      const hito = [...candidatos].sort((a, b) =>
        Number(b?.IdHitoLicitacion || 0) - Number(a?.IdHitoLicitacion || 0))[0];
      return {
        ...event,
        title: `${match[1]}:${String(hito.NombreHito).trim()}`
      };
    });
  }

  private normalizeCalendarEvents(events: CalendarEventRecord[]): CalendarEventRecord[] {
    return events.map((event) => ({
      ...event,
      start: this.normalizeApiDateValue(event.start),
      end: this.normalizeApiDateValue(event.end)
    }));
  }

  private normalizeApiDateValue(value: string | Date | undefined): string | Date | undefined {
    if (!value || value instanceof Date) {
      return value;
    }

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!isoMatch) {
      return value;
    }

    const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = isoMatch;
    const normalizedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds)
    );

    if (Number.isNaN(normalizedDate.getTime())) {
      return value;
    }

    return normalizedDate;
  }

  private buildCalendarEventKey(event: CalendarEventRecord): string {
    const identifier = [
      this.normalizeTextKey(event.title || event.NombreHito),
      this.normalizeTextKey(event.Descripcion),
      this.normalizeTextKey(event.NombreMandante),
      this.normalizeTextKey(event.NombreEjecutivo),
      this.normalizeTextKey(event.HoraCompromiso)
    ].join('|');
    const normalizedStart = this.normalizeDateKeyPart(event.start);
    return `${identifier}|${normalizedStart}`;
  }

  private buildDailyLicitacionKey(licitacion: LicitacionCalendario): string {
    return [
      this.normalizeTextKey(licitacion.NombreHito),
      this.normalizeTextKey(licitacion.Descripcion),
      this.normalizeTextKey(licitacion.NombreMandante),
      this.normalizeTextKey(licitacion.NombreEjecutivo),
      this.normalizeTextKey(licitacion.HoraCompromiso)
    ].join('|');
  }

  private normalizeDateKeyPart(value: string | Date | undefined): string {
    const normalizedValue = this.normalizeApiDateValue(value);
    if (normalizedValue instanceof Date) {
      return this.formatDateForCalendar(normalizedValue);
    }

    return String(normalizedValue || '').trim();
  }

  private normalizeTextKey(value: string | undefined): string {
    return String(value || '').trim().toLowerCase();
  }

  // Verificar si un color es gris
  private isGrayColor(color: string): boolean {
    if (!color) return true; // Sin color se considera gris

    const normalizedColor = color.toLowerCase().trim();

    // Si el color es el color oficial de algún hito, NO es gris.
    // (Ej. "Adjudicación" usa #000000, que por RGB sería clasificado como gris
    // y eso descartaba eventos válidos al filtrar duplicados).
    for (const hitoColor of this.hitoColorMap.values()) {
      if (hitoColor && hitoColor.toLowerCase().trim() === normalizedColor) {
        return false;
      }
    }

    // Rosa pastel NO es gris (para hitos terminados)
    if (normalizedColor === '#f8b4d9' || normalizedColor === 'f8b4d9') {
      return false;
    }

    // Lista de colores grises comunes (colores que el backend asigna por
    // defecto a registros sin color / estados terminados antiguos)
    const grayColors = [
      '#6c757d', '#999', '#999999', '#808080', '#ccc', '#cccccc',
      '#666', '#666666', '#888', '#888888', '#aaa', '#aaaaaa',
      '#dadada', '#ddd', '#dddddd', '#d3d3d3', '#a9a9a9',
      'gray', 'grey', 'lightgray', 'lightgrey', 'darkgray', 'darkgrey'
    ];

    if (grayColors.includes(normalizedColor)) {
      return true;
    }

    return false;
  }
}
