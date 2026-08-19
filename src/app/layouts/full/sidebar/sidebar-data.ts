import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  // =========================================================================
  // 1. ESPACE PERSONNEL (Employé & Manager)
  // =========================================================================
  { 
    navCap: 'Espace Personnel',
    roles: ['EMPLOYE', 'MANAGER']
  },
  { 
    displayName: 'Mon Profil', 
    iconName: 'solar:user-circle-bold-duotone', 
    route: '/profil',
    roles: ['EMPLOYE', 'MANAGER']
  },
  {
    displayName: 'Mon Planning', 
    iconName: 'solar:calendar-mark-bold-duotone', 
    route: '/planning', 
    roles: ['EMPLOYE', 'MANAGER']
  },
  {
    displayName: 'Mes Pointages', 
    iconName: 'solar:clock-circle-bold-duotone', 
    route: '/mes-pointages', 
    roles: ['EMPLOYE', 'MANAGER']
  },
  {
    displayName: 'Mes Statistiques', 
    iconName: 'solar:chart-2-bold-duotone', // 👈 Remplace solar:statistics
    route: '/statistiques/mes-statistiques', 
    roles: ['EMPLOYE', 'MANAGER']
  },

  // =========================================================================
  // 2. MANAGEMENT & ÉQUIPE (Manager uniquement)
  // =========================================================================
  {
    navCap: 'Management & Équipe',
    roles: ['MANAGER']
  },
  {
    displayName: 'Stats Équipe', 
    iconName: 'solar:pie-chart-2-bold-duotone', // 👈 Remplace solar:analytics
    route: '/statistiques/equipe', 
    roles: ['MANAGER']
  },
  {
    displayName: 'Mes Employés',
    iconName: 'solar:users-group-two-rounded-bold-duotone',
    route: '/management/mes-employes',
    roles: ['MANAGER']
  },
  {
    displayName: 'Assigner Planning',
    iconName: 'solar:calendar-add-bold-duotone',
    route: '/management/assigner-planning',
    roles: ['MANAGER']
  },
  {
    displayName: 'Validation Demandes',
    iconName: 'solar:document-text-bold-duotone',
    route: '/app-demandes',
    roles: ['MANAGER']
  },

  // =========================================================================
  // 3. GESTION DU TEMPS (Manager & Admin)
  // =========================================================================
  {
    navCap: 'Gestion du Temps',
    roles: ['MANAGER', 'ADMIN']
  },
  {
    displayName: 'Pointages Globaux',
    iconName: 'solar:history-bold-duotone',
    route: '/pointages',
    roles: ['MANAGER', 'ADMIN']
  },

  // =========================================================================
  // 4. ADMINISTRATION (Admin uniquement)
  // =========================================================================
  { 
    navCap: 'Administration',
    roles: ['ADMIN']
  },{displayName: 'Mon Profil', 
    iconName: 'solar:user-circle-bold-duotone', 
    route: '/profil',
    roles: ['ADMIN']
  },

  {
    displayName: 'Vue Globale', 
    iconName: 'solar:chart-square-bold-duotone', 
    route: '/statistiques/global', 
    roles: ['ADMIN']
  },
  { 
    displayName: 'Gestion Employés', 
    iconName: 'solar:users-group-rounded-bold-duotone', 
    route: '/mes-employes',
    roles: ['ADMIN']
    
  },
  {
    displayName: 'Organisations', 
    iconName: 'solar:buildings-3-bold-duotone', 
    route: '/app-org-table',
    roles: ['ADMIN']
  },
  {
    displayName: 'Structure Entreprise', 
    iconName: 'solar:diagram-up-bold-duotone', 
    route: '/org-tree', 
    roles: ['ADMIN']
  },{
    displayName: 'Pointages Globaux',
    iconName: 'solar:history-bold-duotone',
    route: '/pointages',
    roles: ['ADMIN']
  }
];