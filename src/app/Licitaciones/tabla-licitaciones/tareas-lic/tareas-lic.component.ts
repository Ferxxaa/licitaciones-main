import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { mTarea, Areas } from '../../../model/mTarea';
import { mCorreo } from './Externos/mCorreo';
import { mVis_UsuariosCoordinadores } from './Externos/mVis_UsuariosCoordinadores';
import { sCorreo } from './Externos/sCorreo.service';
import { sMail } from './Externos/sMail.service';
import { sTarea } from './Externos/sTarea.service';
import { sUsuario } from './Externos/sUsuario.service';
import { sVis_UsuariosCoordinadores } from './Externos/sVis_UsuariosCoordinadores.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArrDistingPipe } from './arr-disting.pipe';

declare var Swal: any;

@Component({
  selector: 'app-tareas-lic',
  standalone: true,
  imports: [CommonModule, FormsModule, ArrDistingPipe],
  templateUrl: './tareas-lic.component.html',
  styleUrls: ['./tareas-lic.component.css'],
  providers: [
    sTarea,
    sVis_UsuariosCoordinadores,
    sUsuario,
    sMail,
    sCorreo
  ]
})
export class TareasLicComponent implements OnInit {

  @Input() licitacion: any;

  @Output() crearTarea = new EventEmitter()

  usuario: any;
  Tarea: mTarea;
  Areas: Areas[];

  Responsables$: Observable<mVis_UsuariosCoordinadores[]>;

  constructor(
    private _sTarea: sTarea,
    private _sVis_UsuariosCoordinadores: sVis_UsuariosCoordinadores,
    private _sUsuario: sUsuario,
    private _sMail: sMail,
    private _sCorreo: sCorreo
  ) {

    this.usuario = JSON.parse(localStorage.usuario);
    this.Areas = [
      { idArea: "Administracion", nombre: "Administracion" },
      { idArea: "SGI", nombre: "SGI" },
      { idArea: "SSO_MA", nombre: "SSO_MA" },
      { idArea: "Estudio", nombre: "Estudio" },
      { idArea: "Comercial", nombre: "Comercial" },
      { idArea: "Gerencia", nombre: "Gerencia" },
      { idArea: "Construccion", nombre: "Construcción" },
      { idArea: "Arquitectura", nombre: "Arquitectura" }
    ];
    const fechaActual = new Date().toISOString().split('T')[0];
    this.Tarea = new mTarea(null, null, "Tarea pendiente", null, 0, null, null, null, null, 1, fechaActual, true, null, this.usuario.idUsuario, null, "0", "0");
  }

  ngOnInit() {
    // console.log(this.licitacion);
    const nombreBase = this.licitacion?.Descripcion || this.licitacion?.descripcion || 'Tarea de licitación';
    this.Tarea.nombreTarea = '[LICITACIONES] ' + nombreBase;
    // console.log(this.Tarea);

    this.getResponsable();
  }

  getResponsable() {
    this.Responsables$ = this._sVis_UsuariosCoordinadores.getVis_UsuariosCoordinadores()

    // this.Responsables$
    //   .subscribe(result => {
    //     console.log(result);
    //   });
  }

  Agregar(Form) {
    // Agregar prefijo [LICITACIONES] a la descripción
    let descripcionConPrefijo = '[LICITACIONES] ' + this.Tarea.descripcionTarea;
    this.Tarea.descripcionTarea = descripcionConPrefijo.replace(/\n/g, "<br>");
    
    // Convertir idUsuarioResponsable a número
    if (typeof this.Tarea.idUsuarioResponsable === 'string') {
      this.Tarea.idUsuarioResponsable = parseInt(this.Tarea.idUsuarioResponsable);
    }
    
    // Guardar copia DESPUÉS de modificar la descripción
    let tarTemp = { ...this.Tarea };
    
    console.log('Enviando tarea:', this.Tarea);
    
    this._sTarea.postAddTarea(this.Tarea).subscribe({
      next: (result) => {
      this._sUsuario.getUsuariobyID(tarTemp.idUsuarioResponsable).subscribe(usuarioRes => {
        this._sMail.getMailbyidPersona(usuarioRes.idPersona).subscribe(mail => {
          let mensaje = `Estimado, <br>
          <br>
              Informamos que se le ha asignado la siguiente tarea:<br>
              <h3 style="margin-bottom: 0px;"><b>Descripción de la tarea:</b></h3>
              ${tarTemp.descripcionTarea}<br><br>
              Favor inorporar fecha de compromiso en el siguien link 
              <a href='http://proyectos.trazas-nbi.com/Ver-Tareas' target='_blank'>Mis Tareas</a>`;

          let correoEnviar: mCorreo = new mCorreo(mail[0].direccionMail, 'Tarea asignada', mensaje)
          this._sCorreo.postCorreo(correoEnviar).subscribe(res => { });
          // console.log(correoEnviar);
          this.crearTarea.emit();
          Form.reset();
          const fechaActual = new Date().toISOString().split('T')[0];
          this.Tarea = new mTarea(null, null, null, null, 0, null, null, null, null, 1, fechaActual, true, null, this.usuario.idUsuario, null, "0", "0");
          const nombreBase = this.licitacion?.Descripcion || this.licitacion?.descripcion || 'Tarea de licitación';
          this.Tarea.nombreTarea = '[LICITACIONES] ' + nombreBase;
        });
      });
      Swal.fire(
        'Tareas',
        'Se ha cargado la tarea',
        'success'
      )
      },
      error: (error) => {
        console.error('Error detallado:', error);
        Swal.fire(
          'Error',
          'No se pudo crear la tarea. Por favor revisa la consola para más detalles.',
          'error'
        )
      }
    });
  }

}
