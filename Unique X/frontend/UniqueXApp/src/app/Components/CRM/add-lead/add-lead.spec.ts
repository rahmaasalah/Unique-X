import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLead } from './add-lead';

describe('AddLead', () => {
  let component: AddLead;
  let fixture: ComponentFixture<AddLead>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLead]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddLead);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
