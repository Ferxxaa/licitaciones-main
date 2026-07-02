import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificacionesService, Notificacion } from '../../services/notificaciones.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, HttpClientModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {

  usuario: any = { nombreUsuario: 'Usuario', cargo: '', sponsor: '' };
  date: Date = new Date();
  sponsors: string[] = ['Empresa A', 'Empresa B', 'Empresa C'];

  // Propiedades para notificaciones
  notificaciones: Notificacion[] = [];
  mostrarNotificaciones: boolean = false;
  conteoNotificaciones: number = 0;
  private subscripciones: Subscription[] = [];

  // Propiedad para el menú de usuario
  mostrarMenuUsuario: boolean = false;

  constructor(
    private route: Router, 
    private http: HttpClient,
    private notificacionesService: NotificacionesService
  ) {
    if (!localStorage.hasOwnProperty('usuario')) {
      console.log("usuario no logueado");
    } else {
      try {
  this.usuario = JSON.parse(localStorage['usuario']);
  if (!this.usuario.cargo) this.usuario.cargo = '';
  if (!this.usuario.sponsor) this.usuario.sponsor = '';
      }
      catch (err: any) {
        console.log(err.message);
      }
    }
  }

  ngOnInit() {
    this.date = new Date();
    this.inicializarNotificaciones();
    
    // Listener para cerrar dropdown al hacer clic fuera
    document.addEventListener('click', this.clickOutside.bind(this));
  }

  private inicializarNotificaciones(): void {
    // Suscribirse a las notificaciones
    const notificacionesSub = this.notificacionesService.obtenerNotificaciones()
      .subscribe(notificaciones => {
        // Mostrar solo no leídas en el dropdown (al marcar como leída, desaparece al instante)
        this.notificaciones = (notificaciones || []).filter(n => !n.leida);
      });

    // Suscribirse al conteo de no leídas
    const conteoSub = this.notificacionesService.obtenerConteoNoLeidas()
      .subscribe(conteo => {
        this.conteoNotificaciones = conteo;
      });

    this.subscripciones.push(notificacionesSub, conteoSub);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.clickOutside.bind(this));
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }

  CerrarSesion() {
    this.mostrarMenuUsuario = false;
    localStorage.removeItem("usuario");
    this.route.navigate(['/Login']);
  }

  guardarDatosUsuario() {
    localStorage['usuario'] = JSON.stringify(this.usuario);
    this.mostrarMenuUsuario = false;
    // Opcional: mostrar mensaje de éxito
    alert('Datos de usuario guardados correctamente');
  }

  // Métodos para manejar las notificaciones
  toggleNotificaciones() {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
  }

  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const notificationContainer = target.closest('.notifications-container');
    const userContainer = target.closest('.user-notifications-container');
    
    if (!notificationContainer && this.mostrarNotificaciones) {
      this.mostrarNotificaciones = false;
    }

    // Cerrar menú de usuario si se hace clic fuera
    if (!userContainer && this.mostrarMenuUsuario) {
      this.mostrarMenuUsuario = false;
    }
  }

  toggleUserMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.mostrarMenuUsuario = !this.mostrarMenuUsuario;
    // Cerrar notificaciones si están abiertas
    if (this.mostrarMenuUsuario) {
      this.mostrarNotificaciones = false;
    }
  }

  marcarComoLeida(notificacion: Notificacion) {
    this.notificacionesService.marcarComoLeida(notificacion.id);
  }

  abrirNotificacion(notificacion: Notificacion) {
    // Al abrir/ver, se marca como leída y se quita del dropdown
    this.marcarComoLeida(notificacion);

    // Si es una notificación de tareas, llevar a Ver-Tareas
    if (notificacion?.tipo === 'tarea' || notificacion?.datos?.origen === 'tareas') {
      this.mostrarNotificaciones = false;
      window.open('http://proyectos.trazas-nbi.com/Ver-Tareas', '_blank');
    }
  }

  marcarTodasComoLeidas() {
    this.notificacionesService.marcarTodasComoLeidas();
  }

  actualizarNotificaciones() {
    this.notificacionesService.refrescarNotificaciones();
  }

  verTodasLasNotificaciones() {
    console.log('🔄 Navegando a todas las notificaciones del proyecto...');
    // Cerrar el dropdown
    this.mostrarNotificaciones = false;

    // Navegar al listado de tareas del proyecto de proyectos
    window.open('http://proyectos.trazas-nbi.com/Ver-Tareas', '_blank');
  }

  obtenerIconoTipo(tipo: string): string {
    return this.notificacionesService.obtenerIconoTipo(tipo);
  }

  obtenerColorPrioridad(prioridad: string): string {
    return this.notificacionesService.obtenerColorPrioridad(prioridad);
  }

}
