import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { mVis_UsuariosCoordinadores } from './mVis_UsuariosCoordinadores';

declare var jQuery: any;
declare var $: any;

@Injectable()

export class sVis_UsuariosCoordinadores {

    constructor(
        public http: HttpClient
    ) { }

    getVis_UsuariosCoordinadores(): Observable<mVis_UsuariosCoordinadores[]> {
        return this.http.get<mVis_UsuariosCoordinadores[]>(environment.urlBase + 'Vis_UsuariosCoordinadores');
    }

    getVis_UsuariosCoordinadoresbyID(_id: number): Observable<mVis_UsuariosCoordinadores[]> {
        return this.http.get<mVis_UsuariosCoordinadores[]>(environment.urlBase + 'Vis_UsuariosCoordinadores/' + _id);
    }

    getVis_UsuariosCoordinadoresbyidUsuario(_idUsuario: number): Observable<mVis_UsuariosCoordinadores[]> {
        return this.http.get<mVis_UsuariosCoordinadores[]>(environment.urlBase + 'Vis_UsuariosCoordinadores/GetVis_UsuariosCoordinadoresbyidUsuario/idUsuario=' + _idUsuario);
    }

    getVis_UsuariosCoordinadoresbynombre(_nombre: string): Observable<mVis_UsuariosCoordinadores[]> {
        return this.http.get<mVis_UsuariosCoordinadores[]>(environment.urlBase + 'Vis_UsuariosCoordinadores/GetVis_UsuariosCoordinadoresbynombre/nombre=' + _nombre);
    }

    getVis_UsuariosCoordinadoresbypaterno(_paterno: string): Observable<mVis_UsuariosCoordinadores[]> {
        return this.http.get<mVis_UsuariosCoordinadores[]>(environment.urlBase + 'Vis_UsuariosCoordinadores/GetVis_UsuariosCoordinadoresbypaterno/paterno=' + _paterno);
    }

    getVis_UsuariosCoordinadoresbymaterno(_materno: string): Observable<mVis_UsuariosCoordinadores[]> {
        return this.http.get<mVis_UsuariosCoordinadores[]>(environment.urlBase + 'Vis_UsuariosCoordinadores/GetVis_UsuariosCoordinadoresbymaterno/materno=' + _materno);
    }

    getVis_UsuariosCoordinadoresbyactivo(_activo: boolean): Observable<mVis_UsuariosCoordinadores[]> {
        return this.http.get<mVis_UsuariosCoordinadores[]>(environment.urlBase + 'Vis_UsuariosCoordinadores/GetVis_UsuariosCoordinadoresbyactivo/activo=' + _activo);
    }
}
