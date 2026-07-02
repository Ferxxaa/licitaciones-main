import { TestBed, inject } from '@angular/core/testing';

import { OfertaEconomicaService } from './oferta-economica.service';

describe('OfertaEconomicaService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OfertaEconomicaService]
    });
  });

  it('should be created', inject([OfertaEconomicaService], (service: OfertaEconomicaService) => {
    expect(service).toBeTruthy();
  }));
});
