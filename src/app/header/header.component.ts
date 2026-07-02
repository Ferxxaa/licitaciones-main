import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserComponent } from './user/user.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, UserComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private route: Router) { }

  ngOnInit() {
  }

  CerrarSesion() {
    localStorage.removeItem("usuario");
    this.route.navigate(['/Login']);
  }

}
