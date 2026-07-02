class Licitaciones{
    IdLicitacion: number;
    Descripcion: string;
    NumeroPropuesta: string;
    OfertaInicial:Number;
    Competitividad:string;
    Superficie:number;
    IdArea:number;
    IdMandante:number;
    idEjecutivo:number;
    idEstado:number;
    FechaCreacion:string;
    IdUsuarioCreador:number;
    IdUsuarioRemovedor:number;

    constructor(id:number,nom:string,nomprop:string,oferini:number,copetitividad:string,sup:number,idarea:number,idmandante:number,idejecutivo:number,idestado:number,creacion:string,creador:number,removedor:number){
        this.IdLicitacion=id;
        this.Descripcion=nom;
        this.NumeroPropuesta=nomprop;
        this.OfertaInicial=oferini;
        this.Competitividad=copetitividad
        this.Superficie=sup
        this.IdArea=idarea
        this.IdMandante=idmandante
        this.idEjecutivo=idejecutivo
        this.idEstado=idestado
        this.FechaCreacion=creacion
        this.IdUsuarioCreador=creador;
        this.IdUsuarioRemovedor=removedor;
    }

}