class Mandante{
    IdMandante: number;
    NombreMandante: string;
    FechaCreacion: string;
    IdUsuarioRemovedor:number;
    IdUsuarioCreador:number

    constructor(id:number,nom:string,creacion:string,removedor:number,creador:number){
        this.IdMandante=id;
        this.NombreMandante=nom;
        this.FechaCreacion=creacion;
        this.IdUsuarioRemovedor=removedor;
        this.IdUsuarioCreador=creador;
    }

}