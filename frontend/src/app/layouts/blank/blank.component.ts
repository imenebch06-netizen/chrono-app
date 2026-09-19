import { Component, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ThemeService } from 'src/app/services/theme.service';
import { ThemeToggleComponent } from 'src/app/components/theme-toggle/theme-toggle.component';
import { LangToggleComponent } from 'src/app/components/lang-toggle/lang-toggle.component';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: ['./blank.component.scss'],
  imports: [RouterOutlet, MaterialModule, ThemeToggleComponent, LangToggleComponent],
})
export class BlankComponent {
  private htmlElement!: HTMLHtmlElement;

  options = this.settings.getOptions();
  protected themeService = inject(ThemeService);
  protected theme = this.themeService.theme;

  constructor(private settings: CoreService) {
    this.htmlElement = document.querySelector('html')!;
  }
}