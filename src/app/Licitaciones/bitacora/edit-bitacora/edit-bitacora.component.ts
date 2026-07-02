import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var $: any;
declare var Swal: any;

@Component({
  selector: 'app-edit-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-bitacora.component.html',
  styleUrls: ['./edit-bitacora.component.css']
})
export class EditBitacoraComponent implements OnInit {

  @Input() Bitacora;

  @Output() cerrar = new EventEmitter();

  constructor(private http: HttpClient) { }

  ngOnInit() {
    console.log(this.Bitacora);
    $("#NombreArchEdit").html(this.Bitacora.ArchivoAdjunto);
    setTimeout(() => {
    }, 500);
  }

  NombreArchivo() {
    $("#NombreArchEdit").html($("#fileuploadEdit")[0].files[0].name);
  }

  Editar(bitacora) {

    console.log(bitacora);

    this.Actualizar(bitacora);
  }

  private Actualizar(bitacora: any) {
    let pag = environment.urlBase + "Comentarios/" + bitacora.IdComentario
    let file = $("#fileuploadEdit")[0].files[0]
    if (file && file.name != bitacora.ArchivoAdjunto) {
      this.AdjuntarArchivo(file, "Finanzas").then(file => { });
      bitacora.ArchivoAdjunto = file.name;

    }
    this.http.post<any>(pag, bitacora).subscribe({
      next: (result) => {
        this.close();
        Swal.fire(
          'Bitacora',
          'Se ha editado la Bitacora',
          'success'
        )
      },
      error: (err) => {
        console.error('Error updating bitacora:', err);
      }
    });
  }

  close() {
    this.cerrar.emit(null);
  }

  AdjuntarArchivo(file, tipo: string) {
    return new Promise((resolve, reject) => {
      var formData = new FormData();
      var xhr = new XMLHttpRequest();

      formData.append('adjuntar', file, file.name)
      formData.append('subProy', "Licitaciones")
      formData.append('Tipo', tipo)

      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(xhr.response);
          }
        }
      }

      xhr.open('POST', environment.node + 'adjuntarBitacora', true);
      xhr.send(formData);
    });
  }

}
