import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchList } from './launch-list';

describe('LaunchList', () => {
  let component: LaunchList;
  let fixture: ComponentFixture<LaunchList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaunchList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaunchList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
