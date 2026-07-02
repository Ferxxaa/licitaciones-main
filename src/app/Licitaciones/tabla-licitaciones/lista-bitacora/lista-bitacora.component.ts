import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var $: any;

@Component({
  selector: 'app-lista-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-bitacora.component.html',
  styleUrls: ['./lista-bitacora.component.css']
})
export class ListaBitacoraComponent implements OnInit {

  @Input() usuario;
  @Input() Licitacion;

  //Loading
  LoadingTabla: boolean;

  Bitacoras: Array<any>;
  bitacoraEdit: any;
  url: string;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.LoadingTabla = true;
    this.url = environment.node + "adjuntarBitacora/Licitaciones/";
    this.Bitacoras = [];
  }

  ngOnInit() {
    console.log('ngOnInit lista-bitacora');
    console.log('Licitacion recibida:', this.Licitacion);
    const idLicitacion = this.Licitacion?.IdLicitacion || this.Licitacion?.idLicitacion;
    if (!this.Licitacion || !idLicitacion) {
      console.log("No se ha seleccionado una licitacion válida");
    } else {
      try {
        this.GetComentarios();
      }
      catch (err) {
        console.log('Error al obtener comentarios:', err.message);
      }
    }
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");
  }

  GetComentarios() {
    this.LoadingTabla = true;
    const idLicitacion = this.Licitacion?.IdLicitacion || this.Licitacion?.idLicitacion;
    let pag = environment.urlBase + 'Comentarios/GetComentariosByIdLicitacion/IdLicitacion=' + idLicitacion;
    console.log('URL de petición de comentarios:', pag);
    this.http.get<any[]>(pag)
      .subscribe(data => {
        console.log('Respuesta de la API (comentarios):', data);
        this.Bitacoras = data.sort(this.ordenar);
        data.forEach(element => {
          this.getNombreUSuario(element);
        });
        this.LoadingTabla = false;
      }, error => {
        console.log('Error en la petición de comentarios:', error);
        this.LoadingTabla = false;
      });
  }

  ordenar(a, b) {
    if (a.IdComentario > b.IdComentario)
      return -1
    else if (a.IdComentario < b.IdComentario)
      return 1
    else
      return 0
  }

  getNombreUSuario(bitacora) {
    this.http.get<any[]>(environment.urlBase + "Vis_UsuarioPersona/GetVis_UsuarioPersonabyidUsuario/idUsuario=" + bitacora.IdUsuarioCreador).subscribe((usuarioPersona: any) => {
      bitacora.nombreUsuario = usuarioPersona[0].nombre + " " + usuarioPersona[0].paterno;
      this.cdr.detectChanges();
      // console.log(usuarioPersona[0]);
      console.log(bitacora);
    });
  }

  VerDetalle(bitacoraEdit) {
    this.bitacoraEdit = bitacoraEdit;
  }

}
