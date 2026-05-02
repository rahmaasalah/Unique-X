import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRequest } from './edit-request';

describe('EditRequest', () => {
  let component: EditRequest;
  let fixture: ComponentFixture<EditRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
