import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesPointagesComponent } from './mes-pointages.component';

describe('MesPointagesComponent', () => {
  let component: MesPointagesComponent;
  let fixture: ComponentFixture<MesPointagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesPointagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesPointagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
