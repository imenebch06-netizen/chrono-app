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
  // 🟢 1. RACCOURCI DIRECT CONNEXION
  {
    path: 'login',
    redirectTo: 'authentication/login',
    pathMatch: 'full',
  },

  // 🟢 2. PAGES DE CONNEXION / INSCRIPTION (Plein écran)
  {
    path: 'authentication',
    component: BlankComponent,
    loadChildren: () =>
      import('./pages/authentication/authentication.routes').then(
        (m) => m.AuthenticationRoutes
      ),
  },

   // 🟢 3. APPLICATION PRINCIPALE (Protégée par AuthGuard avec Menu / Sidebar)
  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'profil', // Redirection par défaut vers la page Profil
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
          // 1. Accessible par TOUS les employés
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
          isReadOnly: true,          // 🔒 Masque Ajouter / Modifier / Supprimer
          viewMode: 'TEAM'           // 👥 Charge uniquement l'équipe du manager
        }
      },
      {
        path: 'management/assigner-planning',
        loadComponent: () =>
          import('./pages/assign-planning/assign-planning.component').then((m) => m.AssignPlanningComponent),
        data: {
          isReadOnly: true,
          viewMode: 'WITHOUT_PLANNING' // 📅 Filtre les employés sans planning
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
          // 1. Accessible par TOUS les employés
          {
            path: 'mes-statistiques',
            loadComponent: () =>
              import('./pages/personal-stats/personal-stats.component').then(m => m.PersonalStatsComponent),
          },
          // 2. Accessible par les Employés GÉRANT une Organisation (Manager) ou Admin
          {
            path: 'equipe',
            loadComponent: () =>
              import('./pages/team-stats/team-stats.component').then(m => m.TeamStatsComponent),
          },
          // 3. Accessible UNIQUEMENT par l'ADMIN
          {
            path: 'global',
            loadComponent: () =>
              import('./pages/admin-stats/admin-stats.component').then(m => m.AdminStatsComponent),
          },
        ],
      },
    ],
  },



  // 🟢 4. REDIRECTION PAR DÉFAUT SI ROUTE INEXISTANTE
  {
    path: '**',
    redirectTo: 'authentication/login',
  },
];