import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOrgDialogComponent } from './edit-org-dialog.component';

describe('EditOrgDialogComponent', () => {
  let component: EditOrgDialogComponent;
  let fixture: ComponentFixture<EditOrgDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOrgDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditOrgDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
