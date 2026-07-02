class Areas{
    IdArea: number;
    NombreArea: string;
    FechaCreacion: string;
    IdUsuarioCreador: number;
    FechaRemocion: string;
    IdUsuarioRemovedor:number;
    Activo:boolean;

    constructor(id:number,nom:string,creacion:string,crea:number,remocion:string,removedor:number,act:boolean){
        this.IdArea=id;
        this.NombreArea=nom;
        this.FechaCreacion=creacion;
        this.IdUsuarioCreador=crea;
        this.FechaRemocion=remocion;
        this.IdUsuarioRemovedor=removedor;
        this.Activo=act;
    }

}