import { Component, OnInit } from '@angular/core';
import { NotificacionesService, Notificacion } from '../../services/notificaciones.service';

@Component({
  selector: 'app-notifications-dropdown',
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.css']
})
export class NotificationsDropdownComponent implements OnInit {
  notificaciones: Notificacion[] = [];

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit(): void {
    this.notificacionesService.notificaciones$.subscribe(nots => {
      this.notificaciones = nots;
    });
  }

  refrescar(): void {
    this.notificacionesService.refrescarNotificaciones();
  }
}
