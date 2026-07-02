import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../nav/nav.component';
import { HeaderComponent } from '../header/header.component';

declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, NavComponent, HeaderComponent],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  header: boolean = false;
  nav: boolean = false;

  constructor(private router: Router) { 
    if (typeof $ !== 'undefined') {
      $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
      $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");
    }
    this.header = localStorage.hasOwnProperty('usuario');
    this.nav = localStorage.hasOwnProperty('usuario');
    if (this.header == false) {
      router.navigate(["/Login"]);
    }
  }

  ngOnInit() {
    this.header = localStorage.hasOwnProperty('usuario');
    this.nav = localStorage.hasOwnProperty('usuario');
    if (this.header == false) {
      this.router.navigate(["/Login"]);
    }
  }

}
