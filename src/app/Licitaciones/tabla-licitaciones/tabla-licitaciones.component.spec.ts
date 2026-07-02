import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaLicitacionesComponent } from './tabla-licitaciones.component';

describe('TablaLicitacionesComponent', () => {
  let component: TablaLicitacionesComponent;
  let fixture: ComponentFixture<TablaLicitacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TablaLicitacionesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TablaLicitacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
