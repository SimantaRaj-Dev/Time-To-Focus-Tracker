import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusDomainSelectorComponent } from './focus-domain-selector.component';

describe('FocusDomainSelectorComponent', () => {
  let component: FocusDomainSelectorComponent;
  let fixture: ComponentFixture<FocusDomainSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FocusDomainSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FocusDomainSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
