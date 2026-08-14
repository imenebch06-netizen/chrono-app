import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignPlanningComponent } from './assign-planning.component';

describe('AssignPlanningComponent', () => {
  let component: AssignPlanningComponent;
  let fixture: ComponentFixture<AssignPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignPlanningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
