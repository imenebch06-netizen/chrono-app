import { Routes } from '@angular/router';
import { MesTachesComponent } from './mes-taches/mes-taches.component';

export const PagesRoutes: Routes = [
 
  {
    path: 'mes-taches',
    component: MesTachesComponent,
    data: { title: 'Nouvelle Page' },
  },
];
