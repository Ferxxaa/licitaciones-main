import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeAdnComponent } from './home-adn.component';

describe('HomeAdnComponent', () => {
  let component: HomeAdnComponent;
  let fixture: ComponentFixture<HomeAdnComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeAdnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeAdnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
