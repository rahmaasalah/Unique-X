import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchDetail } from './launch-detail';

describe('LaunchDetail', () => {
  let component: LaunchDetail;
  let fixture: ComponentFixture<LaunchDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaunchDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaunchDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
