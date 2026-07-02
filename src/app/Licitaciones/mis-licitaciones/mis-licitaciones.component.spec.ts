import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { MisLicitacionesComponent } from './mis-licitaciones.component';

describe('MisLicitacionesComponent', () => {
  let component: MisLicitacionesComponent;
  let fixture: ComponentFixture<MisLicitacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MisLicitacionesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MisLicitacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
