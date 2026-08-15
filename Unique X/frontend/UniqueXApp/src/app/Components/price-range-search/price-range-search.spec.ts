import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceRangeSearch } from './price-range-search';

describe('PriceRangeSearch', () => {
  let component: PriceRangeSearch;
  let fixture: ComponentFixture<PriceRangeSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceRangeSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceRangeSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
