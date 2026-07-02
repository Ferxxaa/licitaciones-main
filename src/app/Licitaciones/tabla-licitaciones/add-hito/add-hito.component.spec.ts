import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHitoComponent } from './add-hito.component';

describe('AddHitoComponent', () => {
  let component: AddHitoComponent;
  let fixture: ComponentFixture<AddHitoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddHitoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddHitoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
