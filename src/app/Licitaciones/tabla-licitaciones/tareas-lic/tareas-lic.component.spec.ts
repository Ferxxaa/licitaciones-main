import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { TareasLicComponent } from './tareas-lic.component';

describe('TareasLicComponent', () => {
  let component: TareasLicComponent;
  let fixture: ComponentFixture<TareasLicComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TareasLicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TareasLicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
