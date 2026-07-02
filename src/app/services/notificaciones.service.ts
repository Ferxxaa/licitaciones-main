import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notificacion {
  id: number;
  tipo: 'creacion' | 'cambio_estado' | 'oferta_economica' | 'fecha_vencimiento' | 'tarea';
  titulo: string;
  descripcion: string;
  idLicitacion: number;
  nombreLicitacion: string;
  fechaCreacion: Date;
  fechaVencimiento?: Date;
  leida: boolean;
  idUsuario: number;
  prioridad: 'alta' | 'media' | 'baja';
  datos?: any; // Para datos adicionales específicos del tipo
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private urlBase = environment.urlBase;
  private urlBFF = environment.urlBFF;
  
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$ = this.notificacionesSubject.asObservable();
  
  private conteoNoLeidasSubject = new BehaviorSubject<number>(0);
  public conteoNoLeidas$ = this.conteoNoLeidasSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar notificaciones reales combinadas (licitaciones + proyectos)
    this.cargarNotificacionesReales();
    // Actualizar notificaciones cada 5 minutos
    interval(5 * 60 * 1000).subscribe(() => {
      this.cargarNotificacionesReales();
    });
  }

  private getOcultasStorageKey(idUsuario: number): string {
    return `notificacionesOcultas:${idUsuario}`;
  }

  private cargarOcultas(idUsuario: number): Set<number> {
    try {
      const raw = localStorage.getItem(this.getOcultasStorageKey(idUsuario));
      if (!raw) return new Set<number>();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set<number>();
      return new Set<number>(parsed.filter(x => typeof x === 'number'));
    } catch {
      return new Set<number>();
    }
  }

  private guardarOcultas(idUsuario: number, ocultas: Set<number>): void {
    try {
      localStorage.setItem(this.getOcultasStorageKey(idUsuario), JSON.stringify(Array.from(ocultas)));
    } catch {
      // ignore
    }
  }

  // Cargar solo notificaciones de ejemplo (sin generar automáticamente)
  cargarNotificacionesDeEjemplo(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (!usuario.idUsuario) {
      // Si no hay usuario, usar ID por defecto
      this.agregarNotificacionesDeEjemplo(1);
    } else {
      this.agregarNotificacionesDeEjemplo(usuario.idUsuario);
    }
  }

  // Cargar notificaciones del usuario actual (método original comentado por ahora)
  cargarNotificaciones(): void {
    // Comentado para evitar generación automática
    /*
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (!usuario.idUsuario) return;

    // Primero cargar las licitaciones para generar notificaciones
    this.http.get<any[]>(this.urlBase + 'Licitaciones/GetValuesJoin/join')
      .subscribe({
        next: (licitaciones) => {
          this.generarNotificacionesDeVencimiento(licitaciones, usuario.idUsuario);
          // Aquí también cargaríamos notificaciones guardadas del backend si existen
          this.cargarNotificacionesGuardadas(usuario.idUsuario);
        },
        error: (error) => {
          console.error('Error al cargar licitaciones para notificaciones:', error);
        }
      });
    */
  }

  // Cargar notificaciones guardadas del backend
  private cargarNotificacionesGuardadas(idUsuario: number): void {
    // TODO: Implementar endpoint en el backend para obtener notificaciones
    /*
    this.http.get<Notificacion[]>(`${this.urlBFF}notificaciones/${idUsuario}`)
      .subscribe({
        next: (notificaciones) => {
          this.notificacionesSubject.next(notificaciones);
          this.actualizarConteoNoLeidas();
        },
        error: (error) => {
          console.error('Error al cargar notificaciones guardadas:', error);
        }
      });
    */
  }

  // Generar notificaciones por proximidad de fecha de vencimiento
  private generarNotificacionesDeVencimiento(licitaciones: any[], idUsuario: number): void {
    const notificaciones: Notificacion[] = [];
    const ahora = new Date();
    
    licitaciones.forEach(licitacion => {
      if (licitacion.FechaOferta) {
        const fechaOferta = new Date(licitacion.FechaOferta);
        const diasRestantes = Math.ceil((fechaOferta.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
        
        // Notificación si faltan 3 días o menos
        if (diasRestantes <= 3 && diasRestantes >= 0) {
          let prioridad: 'alta' | 'media' | 'baja' = 'media';
          let titulo = '';
          
          if (diasRestantes === 0) {
            titulo = '¡Vence hoy!';
            prioridad = 'alta';
          } else if (diasRestantes === 1) {
            titulo = 'Vence mañana';
            prioridad = 'alta';
          } else {
            titulo = `Vence en ${diasRestantes} días`;
            prioridad = 'media';
          }

          notificaciones.push({
            id: Date.now() + licitacion.IdLicitacion,
            tipo: 'fecha_vencimiento',
            titulo: titulo,
            descripcion: `La licitación "${licitacion.NombreLicitacion}" vence el ${fechaOferta.toLocaleDateString()}`,
            idLicitacion: licitacion.IdLicitacion,
            nombreLicitacion: licitacion.NombreLicitacion,
            fechaCreacion: ahora,
            fechaVencimiento: fechaOferta,
            leida: false,
            idUsuario: idUsuario,
            prioridad: prioridad,
            datos: {
              diasRestantes: diasRestantes,
              fechaOferta: fechaOferta
            }
          });
        }
      }
    });

    // Comentado para evitar agregar notificaciones automáticamente
    // this.agregarNotificacionesDeEjemplo(idUsuario);

    // Combinar con notificaciones existentes
    const notificacionesExistentes = this.notificacionesSubject.value;
    const todasLasNotificaciones = [...notificaciones, ...notificacionesExistentes];
    
    this.notificacionesSubject.next(todasLasNotificaciones);
    this.actualizarConteoNoLeidas();
  }

  // Crear notificación cuando se crea una licitación
  crearNotificacionLicitacion(licitacion: any): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idUsuario = usuario.idUsuario || 1; // Fallback a 1 si no existe
    const notificacion: Notificacion = {
      id: Date.now(),
      tipo: 'creacion',
      titulo: 'Nueva licitación creada',
      descripcion: `Se ha creado la licitación "${licitacion.NombreLicitacion}"`,
      idLicitacion: licitacion.IdLicitacion,
      nombreLicitacion: licitacion.NombreLicitacion,
      fechaCreacion: new Date(),
      leida: false,
      idUsuario: idUsuario,
      prioridad: 'media',
      datos: licitacion
    };

    this.agregarNotificacion(notificacion);
    
    // TODO: Guardar en el backend
    this.guardarNotificacionEnBackend(notificacion);
  }

  // Crear notificación cuando cambia el estado de una licitación
  crearNotificacionCambioEstado(licitacion: any, nuevoEstado: string, estadoAnterior: string): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    const notificacion: Notificacion = {
      id: Date.now(),
      tipo: 'cambio_estado',
      titulo: 'Estado de licitación actualizado',
      descripcion: `La licitación "${licitacion.NombreLicitacion}" cambió de "${estadoAnterior}" a "${nuevoEstado}"`,
      idLicitacion: licitacion.IdLicitacion,
      nombreLicitacion: licitacion.NombreLicitacion,
      fechaCreacion: new Date(),
      leida: false,
      idUsuario: usuario.idUsuario,
      prioridad: 'alta',
      datos: {
        estadoAnterior: estadoAnterior,
        estadoNuevo: nuevoEstado,
        licitacion: licitacion
      }
    };

    this.agregarNotificacion(notificacion);
    this.guardarNotificacionEnBackend(notificacion);
  }

  // Crear notificación cuando se hace una oferta económica
  crearNotificacionOfertaEconomica(licitacion: any, montoOferta: number, empresa: string): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    const notificacion: Notificacion = {
      id: Date.now(),
      tipo: 'oferta_economica',
      titulo: 'Nueva oferta económica',
      descripcion: `Se recibió una oferta de $${montoOferta.toLocaleString()} de ${empresa} para "${licitacion.NombreLicitacion}"`,
      idLicitacion: licitacion.IdLicitacion,
      nombreLicitacion: licitacion.NombreLicitacion,
      fechaCreacion: new Date(),
      leida: false,
      idUsuario: usuario.idUsuario,
      prioridad: 'alta',
      datos: {
        montoOferta: montoOferta,
        empresa: empresa,
        licitacion: licitacion
      }
    };

    this.agregarNotificacion(notificacion);
    this.guardarNotificacionEnBackend(notificacion);
  }

  // Agregar notificación a la lista actual
  private agregarNotificacion(notificacion: Notificacion): void {
    const notificacionesActuales = this.notificacionesSubject.value;
    const nuevasNotificaciones = [notificacion, ...notificacionesActuales];
    console.log('Agregando notificación:', notificacion);
    this.notificacionesSubject.next(nuevasNotificaciones);
    this.actualizarConteoNoLeidas();
  }

  // Marcar notificación como leída
  marcarComoLeida(notificacionId: number): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idUsuario = usuario.idUsuario || 1;

    // Persistir como "oculta" para que no vuelva a aparecer al recargar
    const ocultas = this.cargarOcultas(idUsuario);
    ocultas.add(notificacionId);
    this.guardarOcultas(idUsuario, ocultas);

    // Remover del listado actual inmediatamente
    const notificaciones = this.notificacionesSubject.value;
    const nuevasNotificaciones = (notificaciones || []).filter(n => n.id !== notificacionId);
    this.notificacionesSubject.next(nuevasNotificaciones);
    this.actualizarConteoNoLeidas();
  }

  // Marcar todas como leídas
  marcarTodasComoLeidas(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idUsuario = usuario.idUsuario || 1;

    const notificaciones = this.notificacionesSubject.value || [];
    const ocultas = this.cargarOcultas(idUsuario);
    notificaciones.forEach(n => ocultas.add(n.id));
    this.guardarOcultas(idUsuario, ocultas);

    // Vaciar la lista (todas ocultas)
    this.notificacionesSubject.next([]);
    this.actualizarConteoNoLeidas();
  }

  // Actualizar conteo de no leídas
  private actualizarConteoNoLeidas(): void {
    const notificaciones = this.notificacionesSubject.value;
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    this.conteoNoLeidasSubject.next(noLeidas);
  }

  // Verificar notificaciones pendientes (llamado periódicamente)
  private verificarNotificacionesPendientes(): void {
    this.cargarNotificaciones();
  }

  // Obtener ícono según el tipo de notificación
  obtenerIconoTipo(tipo: string): string {
    switch(tipo) {
      case 'creacion': return 'fa-plus-circle';
      case 'cambio_estado': return 'fa-exchange';
      case 'oferta_economica': return 'fa-money';
      case 'fecha_vencimiento': return 'fa-clock-o';
      case 'tarea': return 'fa-tasks';
      default: return 'fa-bell';
    }
  }

  // Obtener color según la prioridad
  obtenerColorPrioridad(prioridad: string): string {
    switch(prioridad) {
      case 'alta': return '#dc3545';
      case 'media': return '#ffc107';
      case 'baja': return '#28a745';
      default: return '#6c757d';
    }
  }

  // TODO: Implementar métodos para backend
  private guardarNotificacionEnBackend(notificacion: Notificacion): void {
    /*
    this.http.post(`${this.urlBFF}notificaciones`, notificacion)
      .subscribe({
        next: (response) => {
          console.log('Notificación guardada en backend:', response);
        },
        error: (error) => {
          console.error('Error al guardar notificación:', error);
        }
      });
    */
  }

  private actualizarNotificacionEnBackend(notificacion: Notificacion): void {
    /*
    this.http.put(`${this.urlBFF}notificaciones/${notificacion.id}`, notificacion)
      .subscribe({
        next: (response) => {
          console.log('Notificación actualizada en backend:', response);
        },
        error: (error) => {
          console.error('Error al actualizar notificación:', error);
        }
      });
    */
  }

  // Métodos públicos para obtener notificaciones
  obtenerNotificaciones(): Observable<Notificacion[]> {
    return this.notificaciones$;
  }

  obtenerConteoNoLeidas(): Observable<number> {
    return this.conteoNoLeidas$;
  }

  // Refrescar notificaciones manualmente (incluye notificaciones de proyectos)
  refrescarNotificaciones(): void {
    this.cargarNotificacionesReales();
  }

  // Cargar notificaciones reales de BFF y base de datos
  private cargarNotificacionesReales(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idUsuario = usuario.idUsuario || 1;

    console.log('🔄 Cargando SOLO notificaciones reales para usuario:', idUsuario);

    Promise.all([
      this.obtenerNotificacionesRealesLicitaciones(idUsuario),
      this.obtenerNotificacionesRealesProyectos(idUsuario),
      this.obtenerNotificacionesRealesTareas(idUsuario)
    ])
      .then(([notificacionesLicitaciones, notificacionesProyectos, notificacionesTareas]) => {
        console.log('🏛️ Notificaciones reales de licitaciones:', notificacionesLicitaciones.length);
        console.log('📋 Notificaciones reales de proyectos:', notificacionesProyectos.length);
        console.log('✅ Notificaciones reales de tareas:', notificacionesTareas.length);

        // Combinar listas - SOLO datos reales
        const todasLasNotificaciones = [
          ...notificacionesLicitaciones,
          ...notificacionesProyectos,
          ...notificacionesTareas
        ];

        // Ordenar por fecha (más recientes primero)
        todasLasNotificaciones.sort((a, b) =>
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );

        console.log('✅ Total notificaciones REALES cargadas:', todasLasNotificaciones.length);

        // Aplicar ocultas persistidas (para que no reaparezcan al recargar)
        const ocultas = this.cargarOcultas(idUsuario);
        const visibles = (todasLasNotificaciones || []).filter(n => !ocultas.has(n.id));

        this.notificacionesSubject.next(visibles);
        this.actualizarConteoNoLeidas();
      })
      .catch(error => {
        console.error('❌ Error al obtener notificaciones reales:', error);
        console.log('📝 Sin datos reales disponibles - mostrando lista vacía');
        this.notificacionesSubject.next([]);
        this.actualizarConteoNoLeidas();
      });
  }

  // Obtener notificación REAL basada en tareas pendientes del usuario (API licitaciones)
  private async obtenerNotificacionesRealesTareas(idUsuario: number): Promise<Notificacion[]> {
    try {
      const url = `${this.urlBase}pMis_Tareas/GetMis_TareasByIdUsuario/IdUsuario=${idUsuario}`;
      const response = await this.http.get<any[]>(url).toPromise();

      if (!response || !Array.isArray(response)) {
        return [];
      }

      const toDate = (value: any): Date | undefined => {
        if (!value) return undefined;
        const d = new Date(value);
        return isNaN(d.getTime()) ? undefined : d;
      };

      const mapPrioridad = (value: any): 'alta' | 'media' | 'baja' => {
        const v = String(value || '').toLowerCase();
        if (v === 'alta') return 'alta';
        if (v === 'media') return 'media';
        if (v === 'baja') return 'baja';
        return 'media';
      };

      const limpiarDescripcion = (value: any): string => {
        const raw = String(value || '');
        return raw
          .replace(/<br\s*\/?\s*>/gi, '\n')
          .replace(/\r\n/g, '\n')
          .trim();
      };

      // Pendientes según estado (mis tareas normalmente ya vienen filtradas por usuario)
      const pendientes = response.filter(t => {
        const estado = t?.idEstadoTarea ?? t?.IdEstadoTarea;
        return typeof estado === 'number' ? estado < 3 : false;
      });

      if (pendientes.length === 0) return [];

      // Generar una notificación por tarea (para que refleje Prioridad/Área/Tarea del formulario)
      return pendientes.slice(0, 25).map((t, idx) => {
        const idTarea = t?.idTarea ?? t?.IdTarea ?? idx;
        const prioridadOriginal = t?.prioridad ?? t?.Prioridad;
        const area = t?.area ?? t?.Area;
        const tituloBase = limpiarDescripcion(t?.descripcionTarea ?? t?.DescripcionTarea ?? 'Tarea');
        const tituloCorto = tituloBase.length > 60 ? `${tituloBase.slice(0, 57)}...` : tituloBase;

        return {
          id: 30000 + Number(idTarea),
          tipo: 'tarea',
          titulo: `📌 ${tituloCorto}`,
          descripcion: `Área: ${area || '-'} | Prioridad: ${prioridadOriginal || '-'}\n${tituloBase}`,
          idLicitacion: 0,
          nombreLicitacion: String(t?.nombreTarea ?? t?.NombreTarea ?? 'Mis Tareas'),
          fechaCreacion: toDate(t?.fechaCreacion ?? t?.FechaCreacion) || new Date(),
          fechaVencimiento: toDate(t?.fechaTerminoProgramado ?? t?.FechaTerminoProgramado ?? t?.fechaCompromiso ?? t?.FechaCompromiso),
          leida: false,
          idUsuario,
          prioridad: mapPrioridad(prioridadOriginal),
          datos: {
            origen: 'tareas',
            idTarea,
            area,
            prioridadOriginal,
            idUsuarioResponsable: t?.idUsuarioResponsable ?? t?.IdUsuarioResponsable,
            idUsuarioCreador: t?.idUsuarioCreador ?? t?.IdUsuarioCreador,
            raw: t
          }
        } as Notificacion;
      });
    } catch (error) {
      console.error('❌ Error al obtener notificación de tareas:', error);
      return [];
    }
  }

  // Cargar notificaciones combinadas (fallback con ejemplos)
  private cargarNotificacionesCombinadas(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idUsuario = usuario.idUsuario || 1;

    console.log('🔄 Cargando notificaciones de ejemplo (fallback)');

    // Obtener notificaciones de licitaciones (ejemplos locales)
    const notificacionesLicitaciones = this.obtenerNotificacionesLicitaciones(idUsuario);

    // Obtener notificaciones de proyectos via API
    this.obtenerNotificacionesProyectos(idUsuario).then(notificacionesProyectos => {
      // Combinar ambas listas
      const todasLasNotificaciones = [...notificacionesLicitaciones, ...notificacionesProyectos];
      
      // Ordenar por fecha (más recientes primero)
      todasLasNotificaciones.sort((a, b) => 
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );

      this.notificacionesSubject.next(todasLasNotificaciones);
      this.actualizarConteoNoLeidas();
    }).catch(error => {
      console.error('Error al obtener notificaciones de proyectos:', error);
      // Si falla, solo mostrar las de licitaciones
      this.notificacionesSubject.next(notificacionesLicitaciones);
      this.actualizarConteoNoLeidas();
    });
  }

  // Obtener notificaciones locales de licitaciones
  private obtenerNotificacionesLicitaciones(idUsuario: number): Notificacion[] {
    const ahora = new Date();
    return [
      {
        id: 1001,
        tipo: 'oferta_economica',
        titulo: '🏛️ Nueva oferta económica recibida',
        descripcion: 'Constructora ABC presentó una oferta de $125.000.000 para "Construcción Edificio Administrativo"',
        idLicitacion: 1,
        nombreLicitacion: 'Construcción Edificio Administrativo',
        fechaCreacion: new Date(ahora.getTime() - 2 * 60 * 60 * 1000),
        leida: false,
        idUsuario: idUsuario,
        prioridad: 'alta',
        datos: { montoOferta: 125000000, empresa: 'Constructora ABC' }
      },
      {
        id: 1002,
        tipo: 'cambio_estado',
        titulo: '🏛️ Estado de licitación actualizado',
        descripcion: 'La licitación "Suministro Equipos Médicos" cambió de "En Proceso" a "Adjudicada"',
        idLicitacion: 2,
        nombreLicitacion: 'Suministro Equipos Médicos',
        fechaCreacion: new Date(ahora.getTime() - 4 * 60 * 60 * 1000),
        leida: false,
        idUsuario: idUsuario,
        prioridad: 'alta',
        datos: { estadoAnterior: 'En Proceso', estadoNuevo: 'Adjudicada' }
      }
    ];
  }

  // Obtener notificaciones REALES de licitaciones desde BFF
  private async obtenerNotificacionesRealesLicitaciones(idUsuario: number): Promise<Notificacion[]> {
    try {
      const urlBFF = `${environment.urlBFF}api/licitaciones/notificaciones`;
      const response = await this.http.get(`${urlBFF}?idUsuario=${idUsuario}`).toPromise();
      const data = (response as any).json();
      
      console.log('🏛️ Datos reales de licitaciones desde BFF:', data);
      
      if (!data || !Array.isArray(data)) {
        console.log('📝 Sin datos de licitaciones disponibles');
        return [];
      }

      const notificacionesReales: Notificacion[] = [];
      const ahora = new Date();
      const unDia = 24 * 60 * 60 * 1000; // milisegundos en un día
      const tresDias = 3 * unDia;

      data.forEach((licitacion: any) => {
        console.log(`🔍 Analizando licitación: ${licitacion.NombreLicitacion} (ID: ${licitacion.IdLicitacion})`);
        
        let debeGenerarNotificacion = false;
        let tipoNotificacion: 'creacion' | 'cambio_estado' | 'fecha_vencimiento' | 'oferta_economica' = 'creacion';
        let titulo = '';
        let descripcion = '';
        let prioridad: 'alta' | 'media' | 'baja' = 'media';

        // 1. NUEVA LICITACIÓN: Creada en las últimas 24 horas
        if (licitacion.FechaCreacion) {
          const fechaCreacion = new Date(licitacion.FechaCreacion);
          const horasDesdeCreacion = (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60);
          
          if (horasDesdeCreacion <= 24) {
            console.log(`  ✅ Nueva licitación (${Math.round(horasDesdeCreacion)} horas desde creación)`);
            debeGenerarNotificacion = true;
            tipoNotificacion = 'creacion';
            titulo = '🆕 Nueva licitación creada';
            descripcion = `Se ha creado la licitación "${licitacion.NombreLicitacion}"`;
            prioridad = 'media';
          }
        }

        // 2. CAMBIO DE ESTADO: Si hay fecha de última modificación reciente (últimas 24 horas)
        if (!debeGenerarNotificacion && licitacion.FechaUltimaModificacion) {
          const fechaModificacion = new Date(licitacion.FechaUltimaModificacion);
          const horasDesdeModificacion = (ahora.getTime() - fechaModificacion.getTime()) / (1000 * 60 * 60);
          
          if (horasDesdeModificacion <= 24) {
            console.log(`  ✅ Cambio de estado (${Math.round(horasDesdeModificacion)} horas desde modificación)`);
            debeGenerarNotificacion = true;
            tipoNotificacion = 'cambio_estado';
            titulo = '🔄 Estado de licitación actualizado';
            descripcion = `La licitación "${licitacion.NombreLicitacion}" ha sido actualizada`;
            prioridad = 'alta';
            
            if (licitacion.Estado) {
              descripcion = `La licitación "${licitacion.NombreLicitacion}" cambió a estado "${licitacion.Estado}"`;
            }
          }
        }

        // 3. FECHA DE ENTREGA PRÓXIMA A VENCER: Revisar FechaOferta (fecha de entrega)
        if (!debeGenerarNotificacion && licitacion.FechaOferta) {
          const fechaOferta = new Date(licitacion.FechaOferta);
          const tiempoRestante = fechaOferta.getTime() - ahora.getTime();
          const diasRestantes = Math.ceil(tiempoRestante / unDia);
          
          // Solo notificar si está dentro de los próximos 3 días Y aún no ha vencido
          if (tiempoRestante > 0 && tiempoRestante <= tresDias) {
            console.log(`  ✅ Fecha de entrega próxima (${diasRestantes} días restantes)`);
            debeGenerarNotificacion = true;
            tipoNotificacion = 'fecha_vencimiento';
            prioridad = 'alta';
            
            if (diasRestantes === 0) {
              titulo = '⚠️ ¡Licitación vence HOY!';
              descripcion = `La fecha de entrega de "${licitacion.NombreLicitacion}" es hoy ${fechaOferta.toLocaleDateString()}`;
            } else if (diasRestantes === 1) {
              titulo = '⏰ Licitación vence MAÑANA';
              descripcion = `La fecha de entrega de "${licitacion.NombreLicitacion}" es mañana ${fechaOferta.toLocaleDateString()}`;
            } else {
              titulo = `⏰ Licitación vence en ${diasRestantes} días`;
              descripcion = `La fecha de entrega de "${licitacion.NombreLicitacion}" es el ${fechaOferta.toLocaleDateString()}`;
            }
          } else if (tiempoRestante <= 0) {
            console.log(`  ❌ Fecha de entrega ya pasó (${Math.abs(diasRestantes)} días atrás)`);
          } else {
            console.log(`  ❌ Fecha de entrega muy lejana (${diasRestantes} días)`);
          }
        }

        // Solo crear notificación si cumple algún criterio
        if (debeGenerarNotificacion) {
          console.log(`  📨 Generando notificación: ${tipoNotificacion} - ${titulo}`);
          
          const notificacion: Notificacion = {
            id: licitacion.IdLicitacion + 1000,
            tipo: tipoNotificacion,
            titulo: titulo,
            descripcion: descripcion,
            idLicitacion: licitacion.IdLicitacion,
            nombreLicitacion: licitacion.NombreLicitacion,
            fechaCreacion: licitacion.FechaCreacion ? new Date(licitacion.FechaCreacion) : new Date(),
            fechaVencimiento: licitacion.FechaOferta ? new Date(licitacion.FechaOferta) : undefined,
            leida: false,
            idUsuario: idUsuario,
            prioridad: prioridad,
            datos: {
              mandante: licitacion.NombreMandante,
              area: licitacion.NombreArea,
              montoInicial: licitacion.MontoInicial,
              estado: licitacion.Estado,
              competitividad: licitacion.Competitividad,
              fechaCreacion: licitacion.FechaCreacion,
              fechaUltimaModificacion: licitacion.FechaUltimaModificacion,
              fechaOferta: licitacion.FechaOferta
            }
          };
          
          notificacionesReales.push(notificacion);
        } else {
          console.log(`  ⏭️ No genera notificación (no cumple criterios)`);
        }
      });

      console.log(`✅ Notificaciones reales de licitaciones generadas: ${notificacionesReales.length}`);
      return notificacionesReales;
      
    } catch (error) {
      console.error('❌ Error al obtener notificaciones reales de licitaciones:', error);
      // NO fallback a ejemplos - retornar lista vacía
      return [];
    }
  }

  // Obtener notificaciones REALES de proyectos via BFF
  private async obtenerNotificacionesRealesProyectos(idUsuario: number): Promise<Notificacion[]> {
    try {
      // Llamar al BFF de licitaciones para obtener notificaciones de proyectos
      const urlBFF = `${environment.urlBFF}api/proyectos/notificaciones`;
      const response = await this.http.get(`${urlBFF}?idUsuario=${idUsuario}&origen=licitaciones`).toPromise();
      const data = (response as any).json();
      
      console.log('📋 Datos reales de proyectos desde BFF:', data);

      if (!data || !Array.isArray(data)) {
        console.log('📝 Sin datos de proyectos disponibles');
        return [];
      }

      return data.map((proyecto: any) => {
          const notificacion: Notificacion = {
            id: proyecto.idTarea + 10000,
            tipo: this.mapearTipoProyecto(proyecto.tipo || 'cambio_estado'),
            titulo: `📋 ${proyecto.descripcionTarea || proyecto.nombreTarea}`,
            descripcion: proyecto.descripcionTarea || 'Sin descripción',
            idLicitacion: 0,
            nombreLicitacion: proyecto.nombreSubProyecto || 'Proyecto',
            fechaCreacion: new Date(proyecto.fechaCreacion || new Date()),
            fechaVencimiento: proyecto.fechaTerminoProgramado ? new Date(proyecto.fechaTerminoProgramado) : undefined,
            leida: false,
            idUsuario: idUsuario,
            prioridad: this.determinarPrioridadTarea(proyecto),
            datos: {
              ...(proyecto.datos || {}),
              origen: 'proyectos',
              idSubProyecto: proyecto.idSubProyecto,
              nombreSubProyecto: proyecto.nombreSubProyecto,
              estadoTarea: proyecto.nombreEstadoTarea,
              responsable: proyecto.UsuarioResponsable
            }
          };
          return notificacion;
      });
    } catch (error) {
      console.error('❌ Error al obtener notificaciones reales de proyectos:', error);
      // NO fallback a ejemplos - retornar lista vacía
      return [];
    }
  }

  // Obtener notificaciones de proyectos via BFF (método legacy para fallback)
  private async obtenerNotificacionesProyectos(idUsuario: number): Promise<Notificacion[]> {
    try {
      // Llamar al BFF de licitaciones para obtener notificaciones de proyectos
      const urlBFF = `${environment.urlBFF}api/notificaciones/proyectos`;
      const response = await this.http.get<any[]>(`${urlBFF}?idUsuario=${idUsuario}&origen=licitaciones`).toPromise();
      
      // Convertir las notificaciones de proyectos al formato de licitaciones
      return response?.map(notif => ({
        id: notif.id + 10000, // Offset para evitar conflictos de ID
        tipo: this.mapearTipoProyecto(notif.tipo),
        titulo: `📋 ${notif.titulo}`,
        descripcion: notif.descripcion,
        idLicitacion: 0, // No aplica para notificaciones de proyectos
        nombreLicitacion: 'Proyecto',
        fechaCreacion: new Date(notif.fechaCreacion),
        fechaVencimiento: notif.fechaVencimiento ? new Date(notif.fechaVencimiento) : undefined,
        leida: notif.leida,
        idUsuario: notif.idUsuario,
        prioridad: notif.prioridad,
        datos: notif.datos
      })) || [];
    } catch (error) {
      console.error('Error al obtener notificaciones de proyectos via BFF:', error);
      // Retornar notificaciones de ejemplo de proyectos si falla el BFF
      return this.obtenerNotificacionesProyectosEjemplo(idUsuario);
    }
  }

  // Mapear tipos de notificación de proyectos a tipos de licitaciones
  private mapearTipoProyecto(tipoProyecto: string): 'creacion' | 'cambio_estado' | 'oferta_economica' | 'fecha_vencimiento' {
    const mapeo: { [key: string]: any } = {
      'tarea': 'cambio_estado',
      'proyecto': 'creacion',
      'vencimiento': 'fecha_vencimiento',
      'general': 'cambio_estado'
    };
    return mapeo[tipoProyecto] || 'cambio_estado';
  }

  // Notificaciones de ejemplo de proyectos (fallback)
  private obtenerNotificacionesProyectosEjemplo(idUsuario: number): Notificacion[] {
    const ahora = new Date();
    return [
      {
        id: 2001,
        tipo: 'cambio_estado',
        titulo: '📋 Nueva tarea asignada (via BFF)',
        descripcion: 'Se te asignó la tarea "Revisar documentación técnica" en el proyecto Sistema ERP',
        idLicitacion: 0,
        nombreLicitacion: 'Proyecto',
        fechaCreacion: new Date(ahora.getTime() - 1 * 60 * 60 * 1000),
        fechaVencimiento: new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000),
        leida: false,
        idUsuario: idUsuario,
        prioridad: 'media',
        datos: { origen: 'proyectos' }
      },
      {
        id: 2002,
        tipo: 'fecha_vencimiento',
        titulo: '📋 Tarea próxima a vencer (via BFF)',
        descripcion: 'La tarea "Implementar módulo de reportes" vence en 2 días',
        idLicitacion: 0,
        nombreLicitacion: 'Proyecto',
        fechaCreacion: new Date(ahora.getTime() - 6 * 60 * 60 * 1000),
        fechaVencimiento: new Date(ahora.getTime() + 2 * 24 * 60 * 60 * 1000),
        leida: false,
        idUsuario: idUsuario,
        prioridad: 'alta',
        datos: { origen: 'proyectos' }
      }
    ];
  }

  // Método para agregar exactamente 2 notificaciones de ejemplo
  private agregarNotificacionesDeEjemplo(idUsuario: number): void {
    const ahora = new Date();
    const ejemplos: Notificacion[] = [
      {
        id: 1001,
        tipo: 'oferta_economica',
        titulo: 'Nueva oferta económica recibida',
        descripcion: 'Constructora ABC presentó una oferta de $125.000.000 para "Construcción Edificio Administrativo"',
        idLicitacion: 1,
        nombreLicitacion: 'Construcción Edificio Administrativo',
        fechaCreacion: new Date(ahora.getTime() - 2 * 60 * 60 * 1000), // Hace 2 horas
        leida: false,
        idUsuario: idUsuario,
        prioridad: 'alta',
        datos: {
          montoOferta: 125000000,
          empresa: 'Constructora ABC'
        }
      },
      {
        id: 1002,
        tipo: 'cambio_estado',
        titulo: 'Estado de licitación actualizado',
        descripcion: 'La licitación "Suministro Equipos Médicos" cambió de "En Proceso" a "Adjudicada"',
        idLicitacion: 2,
        nombreLicitacion: 'Suministro Equipos Médicos',
        fechaCreacion: new Date(ahora.getTime() - 4 * 60 * 60 * 1000), // Hace 4 horas
        leida: false,
        idUsuario: idUsuario,
        prioridad: 'alta',
        datos: {
          estadoAnterior: 'En Proceso',
          estadoNuevo: 'Adjudicada'
        }
      }
    ];

    // Solo establecer estas 2 notificaciones, sin agregar a las existentes
    this.notificacionesSubject.next(ejemplos);
    this.actualizarConteoNoLeidas();
  }

  // Métodos helper para procesar datos reales de licitaciones
  private determinarTipoNotificacionLicitacion(licitacion: any): 'creacion' | 'cambio_estado' | 'oferta_economica' | 'fecha_vencimiento' {
    const ahora = new Date();
    
    // Si tiene fecha de oferta y está próxima a vencer (3 días o menos)
    if (licitacion.FechaOferta) {
      const fechaOferta = new Date(licitacion.FechaOferta);
      const diasRestantes = Math.ceil((fechaOferta.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 3 && diasRestantes >= 0) {
        return 'fecha_vencimiento';
      }
    }
    
    // Si es una licitación recién creada (menos de 24 horas)
    if (licitacion.FechaCreacion) {
      const fechaCreacion = new Date(licitacion.FechaCreacion);
      const horasDesdeCreacion = (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60);
      if (horasDesdeCreacion <= 24) {
        return 'creacion';
      }
    }
    
    // Por defecto, cambio de estado
    return 'cambio_estado';
  }

  private generarTituloLicitacion(licitacion: any): string {
    const tipo = this.determinarTipoNotificacionLicitacion(licitacion);
    
    switch (tipo) {
      case 'creacion':
        return `🆕 Nueva Licitación: ${licitacion.NombreLicitacion}`;
      case 'fecha_vencimiento':
        const ahora = new Date();
        const fechaOferta = new Date(licitacion.FechaOferta);
        const diasRestantes = Math.ceil((fechaOferta.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
        if (diasRestantes === 0) {
          return `⚠️ VENCE HOY: ${licitacion.NombreLicitacion}`;
        } else if (diasRestantes === 1) {
          return `⚠️ VENCE MAÑANA: ${licitacion.NombreLicitacion}`;
        } else {
          return `🔔 Vence en ${diasRestantes} días: ${licitacion.NombreLicitacion}`;
        }
      case 'oferta_economica':
        return `💰 Oferta Económica: ${licitacion.NombreLicitacion}`;
      default:
        return `🏛️ ${licitacion.NombreLicitacion}`;
    }
  }

  private generarDescripcionLicitacion(licitacion: any): string {
    const tipo = this.determinarTipoNotificacionLicitacion(licitacion);
    
    switch (tipo) {
      case 'creacion':
        return `Se ha publicado una nueva licitación: ${licitacion.NombreLicitacion}. Mandante: ${licitacion.NombreMandante || 'No especificado'}`;
      case 'fecha_vencimiento':
        return `La licitación "${licitacion.NombreLicitacion}" tiene fecha de cierre próxima: ${new Date(licitacion.FechaOferta).toLocaleDateString()}`;
      case 'oferta_economica':
        return `Nueva actividad en ofertas económicas para "${licitacion.NombreLicitacion}"`;
      default:
        return `Actualización en la licitación "${licitacion.NombreLicitacion}". Área: ${licitacion.NombreArea || 'No especificada'}`;
    }
  }

  private determinarPrioridadLicitacion(licitacion: any): 'alta' | 'media' | 'baja' {
    // Prioridad alta si vence pronto
    if (licitacion.FechaOferta) {
      const ahora = new Date();
      const fechaOferta = new Date(licitacion.FechaOferta);
      const diasRestantes = Math.ceil((fechaOferta.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 1) return 'alta';
      if (diasRestantes <= 3) return 'media';
    }
    
    // Prioridad según competitividad
    if (licitacion.Competitividad) {
      if (licitacion.Competitividad.toLowerCase() === 'alta') return 'alta';
      if (licitacion.Competitividad.toLowerCase() === 'media') return 'media';
    }
    
    // Prioridad según monto
    if (licitacion.MontoInicial && licitacion.MontoInicial > 100000000) return 'alta';
    if (licitacion.MontoInicial && licitacion.MontoInicial > 50000000) return 'media';
    
    return 'baja';
  }

  private determinarPrioridadTarea(tarea: any): 'alta' | 'media' | 'baja' {
    // Prioridad alta si está vencida
    if (tarea.fechaTerminoProgramado) {
      const ahora = new Date();
      const fechaTermino = new Date(tarea.fechaTerminoProgramado);
      if (fechaTermino < ahora) return 'alta';
      
      const diasRestantes = Math.ceil((fechaTermino.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 3) return 'alta';
      if (diasRestantes <= 7) return 'media';
    }
    
    // Usar prioridad de la tarea si existe
    if (tarea.prioridad) {
      const prioridadTarea = tarea.prioridad.toLowerCase();
      if (prioridadTarea === 'alta' || prioridadTarea === 'high') return 'alta';
      if (prioridadTarea === 'media' || prioridadTarea === 'medium') return 'media';
      if (prioridadTarea === 'baja' || prioridadTarea === 'low') return 'baja';
    }
    
    return 'media';
  }
}