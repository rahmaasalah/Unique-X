import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadDetails } from './lead-details';

describe('LeadDetails', () => {
  let component: LeadDetails;
  let fixture: ComponentFixture<LeadDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
