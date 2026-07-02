import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainComponent } from '../../main/main.component';

declare var jQuery: any;
declare var $: any;

// Clase Licitaciones para compatibilidad
class Licitaciones {
  IdLicitacion: number = 0;
  NombreLicitacion: string = '';
  // Agregar más propiedades según sea necesario
}

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.css']
})
export class BitacoraComponent implements OnInit {

  //Comentarios
  Comentarios;

  //Generales
  usuario: any = {};
  Licitacion: Licitaciones;

  //Cargando
  Loading: boolean;
  LoadingTabla: boolean;

  //Mensajes
  msg: string;

  //PopUp
  bitacoraEdit: any;

  //Url
  urlBase: string = "http://trazas-nbi.com:1234/api/";
  controlador: string = "Comentarios/";
  urlFull: string = this.urlBase + this.controlador;

  constructor(private DomSanitizer: DomSanitizer, private http: HttpClient, private route: Router) {
    this.bitacoraEdit = null;
  }

  ngOnInit() {

    if (!localStorage.hasOwnProperty('Licitacion')) {
      console.log("No se ha seleccionado una licitacion");
    } else {
      try {
        this.usuario = JSON.parse(localStorage.usuario);
        this.Licitacion = JSON.parse(localStorage.Licitacion);

        this.GetComentarios();
      }
      catch (err) {
        console.log(err.message);
      }
    }
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");
  }

  GetComentarios() {
    this.LoadingTabla = true;
    let pag = this.urlFull + 'GetComentariosByIdLicitacion/IdLicitacion=' + this.Licitacion.IdLicitacion;
    let loc = this;
    this.http.get<any[]>(pag)
      .subscribe({
        next: (data) => {
          this.Comentarios = data;
          this.LoadingTabla = false;
        },
        error: (err) => {
          console.error('Error loading comentarios:', err);
          this.LoadingTabla = false;
        }
      });
  }

  CargarArchivo(URL: string) {
    let urlfull = 'data:' + URL
    console.log(URL);
    console.log(urlfull);
    window.open(urlfull);
  }

  sanitize(url: string) {
    var iframe = "<iframe style='border: 0px;' width='100%' height='100%' src='" + url + "'></iframe>"
    var x = window.open();
    x.document.open();
    x.document.write(iframe);
  }

  Detalle() {
    this.route.navigate(['/Licitacion-Detalle']);
  }

  Editar(bitacora) {
    // this.edit = true;
    // console.log(bitacora);
    
    this.bitacoraEdit = bitacora;
  }

}
