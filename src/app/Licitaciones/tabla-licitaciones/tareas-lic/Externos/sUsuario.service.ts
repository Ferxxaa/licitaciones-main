import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { mUsuario } from './mUsuario';

declare var jQuery: any;
declare var $: any;

@Injectable()

export class sUsuario{

    constructor(
        public http : HttpClient
    ){}

    getUsuario(): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario');
    }

    getUsuariobyID(_id:number): Observable<any>{
        return this.http.get<any>(environment.urlBase+'Usuario/'+_id);
    }

    getUsuariobyidUsuario(_idUsuario:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobyidUsuario/idUsuario='+_idUsuario);
    }

    getUsuariobyidPersona(_idPersona:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobyidPersona/idPersona='+_idPersona);
    }

    getUsuariobynombreUsuario(_nombreUsuario:string): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobynombreUsuario/nombreUsuario='+_nombreUsuario);
    }

    getUsuariobycontraseniaUsuario(_contraseniaUsuario:string): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobycontraseniaUsuario/contraseniaUsuario='+_contraseniaUsuario);
    }

    getUsuariobyfechaCreacion(_fechaCreacion:Date): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobyfechaCreacion/fechaCreacion='+_fechaCreacion);
    }

    getUsuariobyactivo(_activo:boolean): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobyactivo/activo='+_activo);
    }

    getUsuariobyfechaRemocion(_fechaRemocion:Date): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobyfechaRemocion/fechaRemocion='+_fechaRemocion);
    }

    getUsuariobyidUsuarioCreador(_idUsuarioCreador:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobyidUsuarioCreador/idUsuarioCreador='+_idUsuarioCreador);
    }

    getUsuariobyidUsuarioRemovedor(_idUsuarioRemovedor:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Usuario/GetUsuariobyidUsuarioRemovedor/idUsuarioRemovedor='+_idUsuarioRemovedor);
    }

    postAddUsuario(_Usuario:mUsuario): Observable<any>{
        return this.http.post<any>( environment.urlBase+'Usuario', _Usuario )
    }

    postUpdDelUsuario(_Usuario:mUsuario): Observable<any>{
        return this.http.post<any>( environment.urlBase+'Usuario/'+_Usuario.idUsuario, _Usuario )
    }
}
