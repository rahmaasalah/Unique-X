import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerProfile } from './broker-profile';

describe('BrokerProfile', () => {
  let component: BrokerProfile;
  let fixture: ComponentFixture<BrokerProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrokerProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrokerProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
