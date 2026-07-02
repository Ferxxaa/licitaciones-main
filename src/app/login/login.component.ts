import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { Md5 } from 'ts-md5';
import { Router } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  title: string;
  holterUser: string;
  holterPass: string;
  usuario: any = {};
  login: any = {};
  error: boolean;
  msgError: string;
  status: boolean;

  master: any;

  //Loading
  Load: boolean;

  constructor(private http: HttpClient, private router: Router) {
    this.title = 'Login NBI';
    this.holterUser = 'Username'
    this.holterPass = 'Password'
    //this.getUsuarios();
    this.error = false
    this.msgError = ""
    this.status = true;
    this.Load = false;

    // this.master = new MainComponent(this.router);
    // if (this.master.header) {
    //   router.navigate(["/Home"]);
    // }

  }

  Entrar(form: NgForm): void {
    this.Load = true;
    this.error = true;
    this.http.get('http://trazas-nbi.com:1234/api/Usuario/GetUsuarioBynombreUsuario/nombreusuario=' + form.value.txtuser)
      .pipe(map((res: any) => res))
      .subscribe({
        next: (usuario) => {
          this.Load = false;
          this.usuario = usuario;
          // console.log(this.usuario);
          if (this.usuario[0] === undefined) {
            this.error = true;
            this.msgError = "Error de autenticación";
          }
          else {
            this.status = false;
            if (this.usuario && Md5.hashStr(form.value.txtpass) == this.usuario[0].contraseniaUsuario) {
              localStorage.setItem('usuario', JSON.stringify(this.usuario[0]));
              this.router.navigate(['/Home']);
            }
            else {
              this.error = true;
              this.msgError = "Error de autenticación";
            }
          }
        },
        error: (err) => {
          console.log("Error de login");
          this.Load = false;
        }
      });
  }

  ngOnInit() {
    this.status = false;
    if (typeof $ !== 'undefined') {
      $('#content').attr('class', 'content login fondo');
      $('body').attr('class', 'bg2');
    }
  }

}

