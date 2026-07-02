import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { mMail } from './mMail';

declare var jQuery: any;
declare var $: any;

@Injectable()

export class sMail{

    constructor(
        public http : HttpClient
    ){}

    getMail(): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail');
    }

    getMailbyID(_id:number): Observable<any>{
        return this.http.get<any>(environment.urlBase+'Mail/'+_id);
    }

    getMailbyidMail(_idMail:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyidMail/idMail='+_idMail);
    }

    getMailbydireccionMail(_direccionMail:string): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbydireccionMail/direccionMail='+_direccionMail);
    }

    getMailbyidPersona(_idPersona:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyidPersona/idPersona='+_idPersona);
    }

    getMailbyidTipoMail(_idTipoMail:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyidTipoMail/idTipoMail='+_idTipoMail);
    }

    getMailbyfechaRemocion(_fechaRemocion:Date): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyfechaRemocion/fechaRemocion='+_fechaRemocion);
    }

    getMailbyfechaCreacion(_fechaCreacion:Date): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyfechaCreacion/fechaCreacion='+_fechaCreacion);
    }

    getMailbyactivo(_activo:boolean): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyactivo/activo='+_activo);
    }

    getMailbyidUsuarioCreador(_idUsuarioCreador:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyidUsuarioCreador/idUsuarioCreador='+_idUsuarioCreador);
    }

    getMailbyidUsuarioRemovedor(_idUsuarioRemovedor:number): Observable<any>{
        return this.http.get<any[]>(environment.urlBase+'Mail/GetMailbyidUsuarioRemovedor/idUsuarioRemovedor='+_idUsuarioRemovedor);
    }

    postAddMail(_Mail:mMail):any{
        return $.post( environment.urlBase+'Mail', _Mail )
    }

    postUpdDelMail(_Mail:mMail):any{
        return $.post( environment.urlBase+'Mail/'+_Mail.idMail, _Mail )
    }
}
