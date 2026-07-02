import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LicitacionesComponent } from './licitaciones.component';

describe('LicitacionesComponent', () => {
  let component: LicitacionesComponent;
  let fixture: ComponentFixture<LicitacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LicitacionesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LicitacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
