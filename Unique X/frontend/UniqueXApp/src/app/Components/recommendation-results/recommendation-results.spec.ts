import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendationResults } from './recommendation-results';

describe('RecommendationResults', () => {
  let component: RecommendationResults;
  let fixture: ComponentFixture<RecommendationResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationResults]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendationResults);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
