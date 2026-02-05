import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProperties } from './my-properties';

describe('MyProperties', () => {
  let component: MyProperties;
  let fixture: ComponentFixture<MyProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProperties]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyProperties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
