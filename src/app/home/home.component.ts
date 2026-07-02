import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainComponent } from '../main/main.component';
import { HomeAdnComponent } from './home-adn/home-adn.component';

declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MainComponent, HomeAdnComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  SubProy: any;
  Tareas: any;
  pgProy1: string = '';
  status: boolean = true;
  

  ProgBar: any;
  Proyectos: any[] = [];
  nombreProy: string = '';
  AvanceProyBar: string = '';
  datos: any = {};
  usuario: any = {};
  
  constructor(private http: HttpClient, private router: Router) {
    this.status = true;

    this.Tareas = [
      { Tarea: "Tarea", id: "1" },
      { Tarea: "Tarea1", id: "2" },
      { Tarea: "Tarea2", id: "3" },
    ];

    try {
      this.usuario = JSON.parse(localStorage['usuario']);
    } catch (err: any) {
      console.log(err.message);
    }
  }

  CargaDatosReporteSP() {
    this.status = true;
    this.Proyectos = [];
    
    if (typeof $ !== 'undefined') {
      $.ajax({
        url: "http://trazas-nbi.com:1234/api/SubProyectoCalculado/GetSubProyectoCalculadoByIdUsuarioCoordinador/CalculadoCoordinador=2"
      }).then((data: any) => {
        data.forEach((element: any) => {
          let P = { "Nombre": element.nombreSubProyecto, "Avance": element.AvanceReal, "Estado": element.Estado };
          this.Proyectos.push(P);
        });
        this.status = false;
      });
    }
  }

  ngOnInit() {
    // Cambiar color del nav al entrar a Home (gris)
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        $('#sidebar').attr('style', 'background-color: #525050ff !important');
      } else {
        const nav = document.getElementById('sidebar');
        if (nav) nav.setAttribute('style', 'background-color: #9c9696ff !important');
      }
    }, 500);

    if (typeof $ !== 'undefined') {
      $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
      $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");
      
      $('#content').attr('class', 'content foo');

      $.ajax({
        url: "http://trazas-nbi.com:1234/api/Tarea/GetTareaByidUsuarioResponsable/idUsuarioResponsable=1"
      }).then((data: any) => {
        $('#lblTareasPendientes').append(data.length);
        $('#lblTarPen').append(data.length);
      });
    }

    this.CargaDatosReporteSP();
    this.status = false;
  }

  setMyStyles(index: number) {
    let styles = {
      'width': this.Proyectos[index].Avance + '%',
    };
    return styles;
  }

  getClase(Estado: string): string {
    var clase: string
    if (Estado == "warning") {
      clase = "progress-warning";
    } else if (Estado == "danger") {
      clase = "progress-danger";
    } else {
      clase = "progress-success";
    }
    
    return clase;
  }

}