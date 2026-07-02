import { CalendarioLicComponent } from './calendario-lic.component';

describe('CalendarioLicComponent', () => {
  let component: CalendarioLicComponent;

  beforeEach(() => {
    component = new CalendarioLicComponent({} as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('normalizes api ISO dates without shifting the calendar day', () => {
    const normalized = (component as any).normalizeApiDateValue('2026-04-22T00:00:00.000Z') as Date;

    expect(normalized instanceof Date).toBeTrue();
    expect(normalized.getFullYear()).toBe(2026);
    expect(normalized.getMonth()).toBe(3);
    expect(normalized.getDate()).toBe(22);
  });

  it('deduplicates only truly repeated monthly events and preserves distinct ones', () => {
    const result = (component as any).removeDuplicateHitos([
      {
        IdHitoLicitacion: 566,
        title: 'Adjudicacion',
        Descripcion: 'REPARACION SOCAVON CENTRAL SAUZAL',
        NombreMandante: 'Enel Generacion S.A.',
        NombreEjecutivo: 'Michel Gonzalez',
        start: '2026-04-22T00:00:00.000Z',
        backgroundColor: '#6c757d'
      },
      {
        IdHitoLicitacion: 999,
        title: 'Adjudicacion',
        Descripcion: 'REPARACION SOCAVON CENTRAL SAUZAL',
        NombreMandante: 'Enel Generacion S.A.',
        NombreEjecutivo: 'Michel Gonzalez',
        start: '2026-04-22',
        backgroundColor: '#000000'
      },
      {
        IdHitoLicitacion: 567,
        title: 'Adjudicacion',
        Descripcion: 'OTRA LICITACION',
        NombreMandante: 'Enel Generacion S.A.',
        NombreEjecutivo: 'Michel Gonzalez',
        start: '2026-04-22',
        backgroundColor: '#123456'
      }
    ]);

    expect(result.length).toBe(2);
    expect(result.some((event: any) => event.Descripcion === 'REPARACION SOCAVON CENTRAL SAUZAL' && event.backgroundColor === '#000000')).toBeTrue();
    expect(result.some((event: any) => event.Descripcion === 'OTRA LICITACION')).toBeTrue();
  });
});
