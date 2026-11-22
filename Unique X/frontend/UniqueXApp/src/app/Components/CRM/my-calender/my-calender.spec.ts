import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCalender } from './my-calender';

describe('MyCalender', () => {
  let component: MyCalender;
  let fixture: ComponentFixture<MyCalender>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCalender]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyCalender);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
