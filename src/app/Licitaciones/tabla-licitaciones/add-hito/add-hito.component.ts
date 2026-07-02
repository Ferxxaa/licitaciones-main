import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EliminaActivosPipe } from './elimina-activos.pipe';

declare var $;

export class Hitos {
  IdHito: number;
  Descripcion: string;
  // Add other properties as needed
}

@Component({
  selector: 'app-add-hito',
  standalone: true,
  imports: [CommonModule, FormsModule, EliminaActivosPipe],
  templateUrl: './add-hito.component.html',
  styleUrls: ['./add-hito.component.css']
})
export class AddHitoComponent implements OnInit {

  @Input() licitacion: any;
  @Input() popUp: any;

  @Output() cerrar = new EventEmitter;

  usuario: any;

  Hitos: Observable<Hitos[]>;
  HitosActivos: Hitos[];

  idHito: number;

  constructor(
    private http: HttpClient
  ) {
    this.usuario = JSON.parse(localStorage.usuario);
    this.idHito = 0;
  }

  ngOnInit() {
    this.Hitos = this.GetHitos();
    // console.log(this.licitacion);
    // Usar compatibilidad con mayúsculas y minúsculas
    const idLicitacion = this.licitacion?.IdLicitacion || this.licitacion?.idLicitacion;
    if (idLicitacion) {
      this.getHitosLic(idLicitacion).subscribe(res => {
        this.HitosActivos = res;
        this.idHito = 0;
      });
    }
    // setTimeout(() => {
    //   console.log(this.HitosActivos);
    // }, 1000);
  }

  GetHitos(): Observable<Hitos[]> {
    return this.http.get<Hitos[]>(environment.urlBase + 'Hitos/')
  }

  getHitosLic(idLicitacion: number): Observable<any[]> {
    return this.http.get<any[]>(environment.urlBase + 'Licitaciones/GetHitosHitosLicitacionByLicitaciones/IdLicitacion=' + idLicitacion)
  }

  Agregar() {
    const idLicitacion = this.licitacion?.IdLicitacion || this.licitacion?.idLicitacion;
    // Prevent duplicate hito
    if (this.HitosActivos && this.HitosActivos.some(h => h.IdHito === this.idHito)) {
      alert('Este hito ya ha sido agregado.');
      return;
    }
    this.addHito(this.idHito, idLicitacion, this.usuario.idUsuario).subscribe(result => this.Cerrar())
  }

  addHito(hitoSeleccionado: number, _idLicitacion: number, idUsuario: number): Observable<any> {
    const hito = new URLSearchParams();
    hito.set('IdHito', String(hitoSeleccionado));
    hito.set('IdLicitacion', String(_idLicitacion));
    hito.set('Estado', 'Pendiente');
    hito.set('IdUsuarioCreador', String(idUsuario));
    hito.set('Orden', String(this.HitosActivos.length + 1));
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
    return this.http.post<any>(environment.urlBase + "HitosLicitacion/", hito, { headers: headers });
  }

  Cerrar() {
    // this.popUp = false;
    // console.log(this.popUp);
    this.cerrar.emit({ visible: false });
  }

}
