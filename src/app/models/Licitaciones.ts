export class Licitaciones {
  constructor(
    public idLicitacion?: number,
    public nombre?: string,
    public fechaPublicacion?: Date,
    public fechaCierre?: Date,
    public estado?: string,
    public activo?: boolean
  ) {}
}
