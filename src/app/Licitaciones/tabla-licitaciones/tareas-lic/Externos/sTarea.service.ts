import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { configuracion } from '../config';
import { mTarea } from './mTarea';

declare var $: any;

@Injectable()

export class sTarea {

    constructor(
        public http: HttpClient
    ) { }

    getTarea(): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea');
    }

    getTareabyID(_id: number): Observable<any> {
        return this.http.get<any>(environment.urlBase + 'Tarea/' + _id);
    }

    getTareabyidTarea(_idTarea: number): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyidTarea/idTarea=' + _idTarea);
    }

    getTareabyidDetalleSubProyecto(_idDetalleSubProyecto: number): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyidDetalleSubProyecto/idDetalleSubProyecto=' + _idDetalleSubProyecto);
    }

    getTareabynombreTarea(_nombreTarea: string): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabynombreTarea/nombreTarea=' + _nombreTarea);
    }

    getTareabydescripcionTarea(_descripcionTarea: string): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabydescripcionTarea/descripcionTarea=' + _descripcionTarea);
    }

    getTareabyidUsuarioResponsable(_idUsuarioResponsable: number): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyidUsuarioResponsable/idUsuarioResponsable=' + _idUsuarioResponsable);
    }

    getTareabyfechaInicioProgramado(_fechaInicioProgramado: Date): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyfechaInicioProgramado/fechaInicioProgramado=' + _fechaInicioProgramado);
    }

    getTareabyfechaTerminoProgramado(_fechaTerminoProgramado: Date): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyfechaTerminoProgramado/fechaTerminoProgramado=' + _fechaTerminoProgramado);
    }

    getTareabyfechaInicioReal(_fechaInicioReal: Date): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyfechaInicioReal/fechaInicioReal=' + _fechaInicioReal);
    }

    getTareabyfechaTerminoReal(_fechaTerminoReal: Date): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyfechaTerminoReal/fechaTerminoReal=' + _fechaTerminoReal);
    }

    getTareabyidEstadoTarea(_idEstadoTarea: number): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyidEstadoTarea/idEstadoTarea=' + _idEstadoTarea);
    }

    getTareabyfechaCreacion(_fechaCreacion: Date): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyfechaCreacion/fechaCreacion=' + _fechaCreacion);
    }

    getTareabyactivo(_activo: boolean): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyactivo/activo=' + _activo);
    }

    getTareabyfechaRemocion(_fechaRemocion: Date): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyfechaRemocion/fechaRemocion=' + _fechaRemocion);
    }

    getTareabyidUsuarioCreador(_idUsuarioCreador: number): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyidUsuarioCreador/idUsuarioCreador=' + _idUsuarioCreador);
    }

    getTareabyidUsuarioRemovedor(_idUsuarioRemovedor: number): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyidUsuarioRemovedor/idUsuarioRemovedor=' + _idUsuarioRemovedor);
    }

    getTareabyprioridad(_prioridad: string): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyprioridad/prioridad=' + _prioridad);
    }

    getTareabyarea(_area: string): Observable<any> {
        return this.http.get<any[]>(environment.urlBase + 'Tarea/GetTareabyarea/area=' + _area);
    }

    postAddTarea(_Tarea: mTarea): Observable<any> {
        // Enviar como application/x-www-form-urlencoded (mismo patrón que addHito)
        const params = new URLSearchParams();
        if (_Tarea?.idTarea !== undefined && _Tarea?.idTarea !== null) params.set('idTarea', String(_Tarea.idTarea));
        if (_Tarea?.idDetalleSubProyecto !== undefined && _Tarea?.idDetalleSubProyecto !== null) params.set('idDetalleSubProyecto', String(_Tarea.idDetalleSubProyecto));
        if (_Tarea?.nombreTarea !== undefined && _Tarea?.nombreTarea !== null) params.set('nombreTarea', String(_Tarea.nombreTarea));
        if (_Tarea?.descripcionTarea !== undefined && _Tarea?.descripcionTarea !== null) params.set('descripcionTarea', String(_Tarea.descripcionTarea));
        if (_Tarea?.idUsuarioResponsable !== undefined && _Tarea?.idUsuarioResponsable !== null) params.set('idUsuarioResponsable', String(_Tarea.idUsuarioResponsable));
        if (_Tarea?.fechaInicioProgramado !== undefined && _Tarea?.fechaInicioProgramado !== null) params.set('fechaInicioProgramado', String(_Tarea.fechaInicioProgramado));
        if (_Tarea?.fechaTerminoProgramado !== undefined && _Tarea?.fechaTerminoProgramado !== null) params.set('fechaTerminoProgramado', String(_Tarea.fechaTerminoProgramado));
        if (_Tarea?.fechaInicioReal !== undefined && _Tarea?.fechaInicioReal !== null) params.set('fechaInicioReal', String(_Tarea.fechaInicioReal));
        if (_Tarea?.fechaTerminoReal !== undefined && _Tarea?.fechaTerminoReal !== null) params.set('fechaTerminoReal', String(_Tarea.fechaTerminoReal));
        if (_Tarea?.idEstadoTarea !== undefined && _Tarea?.idEstadoTarea !== null) params.set('idEstadoTarea', String(_Tarea.idEstadoTarea));
        if (_Tarea?.fechaCreacion !== undefined && _Tarea?.fechaCreacion !== null) params.set('fechaCreacion', String(_Tarea.fechaCreacion));
        if (_Tarea?.activo !== undefined && _Tarea?.activo !== null) params.set('activo', String(_Tarea.activo));
        if (_Tarea?.fechaRemocion !== undefined && _Tarea?.fechaRemocion !== null) params.set('fechaRemocion', String(_Tarea.fechaRemocion));
        if (_Tarea?.idUsuarioCreador !== undefined && _Tarea?.idUsuarioCreador !== null) params.set('idUsuarioCreador', String(_Tarea.idUsuarioCreador));
        if (_Tarea?.idUsuarioRemovedor !== undefined && _Tarea?.idUsuarioRemovedor !== null) params.set('idUsuarioRemovedor', String(_Tarea.idUsuarioRemovedor));
        if (_Tarea?.prioridad !== undefined && _Tarea?.prioridad !== null) params.set('prioridad', String(_Tarea.prioridad));
        if (_Tarea?.area !== undefined && _Tarea?.area !== null) params.set('area', String(_Tarea.area));

        const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
        return this.http.post<any>(environment.urlBase + 'Tarea', params, { headers });
    }

    postUpdDelTarea(_Tarea: mTarea): Observable<any> {
        // Enviar como application/x-www-form-urlencoded (mismo patrón que addHito)
        const params = new URLSearchParams();
        if (_Tarea?.idTarea !== undefined && _Tarea?.idTarea !== null) params.set('idTarea', String(_Tarea.idTarea));
        if (_Tarea?.idDetalleSubProyecto !== undefined && _Tarea?.idDetalleSubProyecto !== null) params.set('idDetalleSubProyecto', String(_Tarea.idDetalleSubProyecto));
        if (_Tarea?.nombreTarea !== undefined && _Tarea?.nombreTarea !== null) params.set('nombreTarea', String(_Tarea.nombreTarea));
        if (_Tarea?.descripcionTarea !== undefined && _Tarea?.descripcionTarea !== null) params.set('descripcionTarea', String(_Tarea.descripcionTarea));
        if (_Tarea?.idUsuarioResponsable !== undefined && _Tarea?.idUsuarioResponsable !== null) params.set('idUsuarioResponsable', String(_Tarea.idUsuarioResponsable));
        if (_Tarea?.fechaInicioProgramado !== undefined && _Tarea?.fechaInicioProgramado !== null) params.set('fechaInicioProgramado', String(_Tarea.fechaInicioProgramado));
        if (_Tarea?.fechaTerminoProgramado !== undefined && _Tarea?.fechaTerminoProgramado !== null) params.set('fechaTerminoProgramado', String(_Tarea.fechaTerminoProgramado));
        if (_Tarea?.fechaInicioReal !== undefined && _Tarea?.fechaInicioReal !== null) params.set('fechaInicioReal', String(_Tarea.fechaInicioReal));
        if (_Tarea?.fechaTerminoReal !== undefined && _Tarea?.fechaTerminoReal !== null) params.set('fechaTerminoReal', String(_Tarea.fechaTerminoReal));
        if (_Tarea?.idEstadoTarea !== undefined && _Tarea?.idEstadoTarea !== null) params.set('idEstadoTarea', String(_Tarea.idEstadoTarea));
        if (_Tarea?.fechaCreacion !== undefined && _Tarea?.fechaCreacion !== null) params.set('fechaCreacion', String(_Tarea.fechaCreacion));
        if (_Tarea?.activo !== undefined && _Tarea?.activo !== null) params.set('activo', String(_Tarea.activo));
        if (_Tarea?.fechaRemocion !== undefined && _Tarea?.fechaRemocion !== null) params.set('fechaRemocion', String(_Tarea.fechaRemocion));
        if (_Tarea?.idUsuarioCreador !== undefined && _Tarea?.idUsuarioCreador !== null) params.set('idUsuarioCreador', String(_Tarea.idUsuarioCreador));
        if (_Tarea?.idUsuarioRemovedor !== undefined && _Tarea?.idUsuarioRemovedor !== null) params.set('idUsuarioRemovedor', String(_Tarea.idUsuarioRemovedor));
        if (_Tarea?.prioridad !== undefined && _Tarea?.prioridad !== null) params.set('prioridad', String(_Tarea.prioridad));
        if (_Tarea?.area !== undefined && _Tarea?.area !== null) params.set('area', String(_Tarea.area));

        const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
        return this.http.post<any>(environment.urlBase + 'Tarea/' + _Tarea.idTarea, params, { headers })
        // return $.post(environment.urlBase + 'Tarea/' + _Tarea.idTarea, _Tarea)
    }
}
