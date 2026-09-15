import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { LanguageService } from './services/language.service';
import { IconService } from './services/icon.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Chrono | Plateforme de Gestion du Temps et des Activités';


  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);
  private iconService = inject(IconService);
}