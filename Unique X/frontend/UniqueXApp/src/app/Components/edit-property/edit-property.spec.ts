import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProperty } from './edit-property';

describe('EditProperty', () => {
  let component: EditProperty;
  let fixture: ComponentFixture<EditProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProperty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
