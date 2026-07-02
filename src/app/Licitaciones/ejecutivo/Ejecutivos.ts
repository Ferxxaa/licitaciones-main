class Ejecutivos{
    IdEjecutivos: number;
    NombreEjecutivo: string;
    Telefono: string;
    Celular: string;
    Correo: string;
    FechaCreacion: string;
    IdMandante: number;
    IdUsuarioRemovedor:number;
    IdUsuarioCreador:number;

    constructor(id:number,nom:string,creacion:string,tel:string,cel:string,correo:string,man:number,removedor:number,creador:number){
        this.IdEjecutivos=id;
        this.NombreEjecutivo=nom;
        this.Telefono=tel;
        this.Celular=cel;
        this.Correo=correo;
        this.FechaCreacion=creacion;
        this.IdMandante=man;
        this.IdUsuarioRemovedor=removedor;
        this.IdUsuarioCreador=creador;
    }

}