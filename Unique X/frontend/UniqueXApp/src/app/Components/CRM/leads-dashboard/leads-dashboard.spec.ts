import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadsDashboard } from './leads-dashboard';

describe('LeadsDashboard', () => {
  let component: LeadsDashboard;
  let fixture: ComponentFixture<LeadsDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadsDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
