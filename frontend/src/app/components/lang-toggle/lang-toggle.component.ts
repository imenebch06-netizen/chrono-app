import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  imports: [CommonModule, MaterialModule, TranslateModule],
  templateUrl: './lang-toggle.component.html',
  styleUrls: ['./lang-toggle.component.scss'],
})
export class LangToggleComponent {
  protected languageService = inject(LanguageService);
  protected currentLang = this.languageService.currentLang;
}