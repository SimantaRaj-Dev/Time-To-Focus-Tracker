import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartSessionComponent } from './start-session.component';

describe('StartSessionComponent', () => {
  let component: StartSessionComponent;
  let fixture: ComponentFixture<StartSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartSessionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StartSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
