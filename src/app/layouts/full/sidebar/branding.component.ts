import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [RouterModule],
  template: `
    
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 345 100" width="100%" height="100%">
  <!-- Symbol / Monogramme -->
  <g>
    <!-- Fond Icône -->
    <rect x="0" y="0" width="100" height="100" rx="28" fill="#EEF2FF"/>
    
    <!-- Cadran Horloge C -->
    <path d="M 68 32 A 26 26 0 1 0 68 68" 
          fill="none" 
          stroke="#4338CA" 
          stroke-width="8" 
          stroke-linecap="round"/>
    
    <!-- Aiguilles -->
    <path d="M 50 50 L 50 34 M 50 50 L 62 50" 
          stroke="#4338CA" 
          stroke-width="6" 
          stroke-linecap="round"/>
  </g>

  <!-- Titre principal CHRONO -->
  <text x="118" y="58" 
        font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-weight="900" 
        font-size="52" 
        fill="var(--mat-sys-on-background, #0F172A)" 
        letter-spacing="-0.5">CHRONO</text>

  <!-- Sous-titre TIME MANAGEMENT -->
  <text x="120" y="85" 
        font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-weight="700" 
        font-size="14" 
        fill="#6366F1" 
        letter-spacing="5">TIME MANAGEMENT</text>
</svg>



  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {} 
}