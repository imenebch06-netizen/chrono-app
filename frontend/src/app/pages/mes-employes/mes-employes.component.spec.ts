import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesEmployesComponent } from './mes-employes.component';

describe('MesEmployesComponent', () => {
  let component: MesEmployesComponent;
  let fixture: ComponentFixture<MesEmployesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesEmployesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesEmployesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
