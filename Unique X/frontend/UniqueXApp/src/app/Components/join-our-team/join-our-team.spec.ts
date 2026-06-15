import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinOurTeam } from './join-our-team';

describe('JoinOurTeam', () => {
  let component: JoinOurTeam;
  let fixture: ComponentFixture<JoinOurTeam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinOurTeam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinOurTeam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
