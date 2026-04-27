import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrmNavbar } from './crm-navbar';

describe('CrmNavbar', () => {
  let component: CrmNavbar;
  let fixture: ComponentFixture<CrmNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrmNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
