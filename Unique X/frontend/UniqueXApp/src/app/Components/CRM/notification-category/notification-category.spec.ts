import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationCategory } from './notification-category';

describe('NotificationCategory', () => {
  let component: NotificationCategory;
  let fixture: ComponentFixture<NotificationCategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCategory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationCategory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
