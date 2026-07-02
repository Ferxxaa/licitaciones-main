import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-adn',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-adn.component.html',
  styleUrls: ['./home-adn.component.css']
})
export class HomeAdnComponent implements OnInit {

  Titulo: string;

  constructor() {
    this.Titulo = ""
  }

  ngOnInit() {
  }

}
