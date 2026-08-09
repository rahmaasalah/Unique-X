import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreHome } from './explore-home';

describe('ExploreHome', () => {
  let component: ExploreHome;
  let fixture: ComponentFixture<ExploreHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
