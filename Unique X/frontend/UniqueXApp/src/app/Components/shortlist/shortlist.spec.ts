import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shortlist } from './shortlist';

describe('Shortlist', () => {
  let component: Shortlist;
  let fixture: ComponentFixture<Shortlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shortlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shortlist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
