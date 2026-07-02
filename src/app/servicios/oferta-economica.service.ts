import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class OfertaEconomicaService {

  path: string;

  constructor(
    private http: HttpClient
  ) {
    this.path = environment.urlBase + 'ContraOferta/'
  }

  getOfertasEconomicas(idLicitacion: number) {
    return this.http.get<any[]>(this.path + 'GetContraOfertaByIdLicitacion/IdLicitacion=' + idLicitacion)
  }

}
