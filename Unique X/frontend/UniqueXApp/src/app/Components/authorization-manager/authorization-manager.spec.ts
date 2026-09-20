import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizationManager } from './authorization-manager';

describe('AuthorizationManager', () => {
  let component: AuthorizationManager;
  let fixture: ComponentFixture<AuthorizationManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizationManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorizationManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
