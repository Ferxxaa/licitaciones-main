import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { MandantesComponent } from './mandantes.component';

describe('MandantesComponent', () => {
  let component: MandantesComponent;
  let fixture: ComponentFixture<MandantesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MandantesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MandantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
