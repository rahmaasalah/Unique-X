import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValuationComponent } from './valuation.component';

describe('ValuationComponent', () => {
  let component: ValuationComponent;
  let fixture: ComponentFixture<ValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValuationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValuationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
