import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { leadFeedbackGuard } from './lead-feedback-guard';

describe('leadFeedbackGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => leadFeedbackGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
