import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindAgent } from './find-agent';

describe('FindAgent', () => {
  let component: FindAgent;
  let fixture: ComponentFixture<FindAgent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindAgent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FindAgent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
