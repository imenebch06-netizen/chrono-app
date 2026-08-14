import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgTreeNodeComponent } from './org-tree.component';

describe('OrgTreeNodeComponent', () => {
  let component: OrgTreeNodeComponent;
  let fixture: ComponentFixture<OrgTreeNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgTreeNodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgTreeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
