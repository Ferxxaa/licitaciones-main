class Hitos{
    IdHito: number;
    NombreHito: string;
    Obligatoria: boolean;
    Calendarizada: boolean;
    NombreCalendario: string;
    ColorCalendario: string;
    FechaCreacion: string;
    FechaCompromiso: string;
    IdUsuarioCreador:number;
    IdUsuarioRemovedor:number;

    constructor(id:number,nom:string,ob:boolean,cal:boolean,nomcal:string,colcal:string,creacion:string,compromiso:string,creador:number,removedor:number){
        this.IdHito=id;
        this.NombreHito=nom;
        this.Obligatoria=ob;
        this.Calendarizada=cal;
        this.NombreCalendario=nomcal;
        this.ColorCalendario=colcal;
        this.FechaCreacion=creacion;
        this.FechaCompromiso=compromiso;
        this.IdUsuarioCreador=creador;
        this.IdUsuarioRemovedor=removedor;
    }
}