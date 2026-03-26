import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareProperties } from './compare-properties';

describe('CompareProperties', () => {
  let component: CompareProperties;
  let fixture: ComponentFixture<CompareProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompareProperties]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompareProperties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
