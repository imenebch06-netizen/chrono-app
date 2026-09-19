import { Routes } from '@angular/router';
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { authGuard } from './guards/auth.guard';
import { OrganizationComponent } from './pages/organization/organization.component';
import { DataTableTestComponent } from './components/data-table/data-table.component';
import { MesEmployesComponent } from './pages/mes-employes/mes-employes.component';
import { AssignPlanningComponent } from './pages/assign-planning/assign-planning.component';
import { PointagesComponent } from './pages/pointages/pointages.component';
import { AdminStatsComponent } from './pages/admin-stats/admin-stats.component';
import { TeamStatsComponent } from './pages/team-stats/team-stats.component';
import { PersonalStatsComponent } from './pages/personal-stats/personal-stats.component';

export const routes: Routes = [
 {
    path: '',
    redirectTo: 'authentication/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    redirectTo: 'authentication/login',
    pathMatch: 'full',
  },

  
  {
    path: 'authentication',
    component: BlankComponent,
    loadChildren: () =>
      import('./pages/authentication/authentication.routes').then(
        (m) => m.AuthenticationRoutes
      ),
  },

   
  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'profil', 
        pathMatch: 'full',
      },

      // --- SECTION HOME ---
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/profil/profil.component').then((m) => m.ProfilComponent),
      },

      // --- SECTION ADMINISTRATION ---
       {path: 'mes-employes',
        children: [
         
          {
            path: '',
            loadComponent: () =>
              import('./pages/mes-employes/mes-employes.component').then((m) => m.MesEmployesComponent),
          },
           {
            path: 'employe/:id',
            loadComponent: () =>
            import('./components/details-employe/details-employe.component').then((m) => m.DetailsEmployeComponent),
            }
          ]
        },
      {
        path: 'app-org-table',
        loadComponent: () =>
          import('./pages/organization/organization.component').then((m) => m.OrganizationComponent),
      },
      {
        path: 'org-tree',
        loadComponent: () =>
          import('./pages/org-tree/org-tree.component').then((m) => m.OrgTreeComponent),
      },

      // --- SECTION ESPACE EMPLOYE ---
      {
        path: 'planning',
        loadComponent: () =>
          import('./pages/mon-planning/mon-planning.component').then((m) => m.MonPlanningComponent),
      },
      {
        path: 'management/mes-employes',
        loadComponent: () =>
          import('./pages/mes-employes/mes-employes.component').then((m) => m.MesEmployesComponent),
        data: {
          isReadOnly: true,          
          viewMode: 'TEAM'           
        }
      },
      {
        path: 'management/assigner-planning',
        loadComponent: () =>
          import('./pages/assign-planning/assign-planning.component').then((m) => m.AssignPlanningComponent),
        data: {
          isReadOnly: true,
          viewMode: 'WITHOUT_PLANNING' 
        }
      },
      {
        path: 'app-demandes',
        loadComponent: () =>
          import('./pages/demandes/demandes.component').then(m => m.DemandesComponent),
      },
      {
        path: 'pointages',
        loadComponent: () =>
          import('./pages/pointages/pointages.component').then(m => m.PointagesComponent),
        canActivate: [authGuard],
        data: {
          title: 'Gestion des Pointages',
          urls: [
            { title: 'Tableau de bord', url: '/dashboard' },
            { title: 'Pointages' }
          ]
        }
      },
      {
        path: 'mes-pointages',
        loadComponent: () =>
          import('./pages/mes-pointages/mes-pointages.component').then(m => m.MesPointagesComponent),
      },
      {
        path: 'statistiques',
        children: [
          
          {
            path: 'mes-statistiques',
            loadComponent: () =>
              import('./pages/personal-stats/personal-stats.component').then(m => m.PersonalStatsComponent),
          },
         
          {
            path: 'equipe',
            loadComponent: () =>
              import('./pages/team-stats/team-stats.component').then(m => m.TeamStatsComponent),
          },
          
          {
            path: 'global',
            loadComponent: () =>
              import('./pages/admin-stats/admin-stats.component').then(m => m.AdminStatsComponent),
          },
        ],
      },
    ],
  },



  
  {
    path: '**',
    redirectTo: 'authentication/login',
  },
];