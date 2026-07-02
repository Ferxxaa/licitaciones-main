import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { HitosComponent } from './hitos.component';

describe('HitosComponent', () => {
  let component: HitosComponent;
  let fixture: ComponentFixture<HitosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HitosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HitosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
