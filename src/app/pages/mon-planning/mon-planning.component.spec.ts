import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonPlanningComponent } from './mon-planning.component';

describe('MonPlanningComponent', () => {
  let component: MonPlanningComponent;
  let fixture: ComponentFixture<MonPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonPlanningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
