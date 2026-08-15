import { TestBed } from '@angular/core/testing';

import { RecommendationModalService } from './recommendation-modal.service';

describe('RecommendationModalService', () => {
  let service: RecommendationModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecommendationModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
