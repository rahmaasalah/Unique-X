import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Visitlist } from './visitlist';

describe('Visitlist', () => {
  let component: Visitlist;
  let fixture: ComponentFixture<Visitlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Visitlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Visitlist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
