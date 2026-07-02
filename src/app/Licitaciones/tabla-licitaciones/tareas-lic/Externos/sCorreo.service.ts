import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { mCorreo } from './mCorreo';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable()

export class sCorreo {

    constructor(
        public http: HttpClient
    ) { }

    postCorreo(Correo: mCorreo): Observable<any> {
        console.log("Servicio de correo: ", Correo);
        console.log(environment.node);

        if (Correo.archivo) {
            console.log("Enviando con adjunto");
            return this.http.post<any>(environment.node + 'correoAttach/', Correo);
        }
        else {
            console.log("Enviando sin adjunto");
            console.log(environment.node + 'correo/');
            return this.http.post<any>(environment.node + 'correo/', Correo);
        }
    }

}
