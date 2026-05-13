import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampaignsManager } from './campaigns-manager';

describe('CampaignsManager', () => {
  let component: CampaignsManager;
  let fixture: ComponentFixture<CampaignsManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignsManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampaignsManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
