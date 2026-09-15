import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  // =========================================================================
  // 1. ESPACE PERSONNEL (Employé & Manager)
  // =========================================================================
  { 
    navCap: 'NAV.PERSONAL_SPACE',
    roles: ['EMPLOYE', 'MANAGER']
  },
  { 
    displayName: 'NAV.MY_PROFILE', 
    iconName: 'solar:user-circle-bold-duotone', 
    route: '/profil',
    roles: ['EMPLOYE', 'MANAGER']
  },
  {
    displayName: 'NAV.MY_PLANNING', 
    iconName: 'solar:calendar-mark-bold-duotone', 
    route: '/planning', 
    roles: ['EMPLOYE', 'MANAGER']
  },
  {
    displayName: 'NAV.MY_CLOCKINGS', 
    iconName: 'solar:clock-circle-bold-duotone', 
    route: '/mes-pointages', 
    roles: ['EMPLOYE', 'MANAGER']
  },
  {
    displayName: 'NAV.MY_STATS', 
    iconName: 'solar:chart-2-bold-duotone',
    route: '/statistiques/mes-statistiques', 
    roles: ['EMPLOYE', 'MANAGER']
  },

  // =========================================================================
  // 2. MANAGEMENT & ÉQUIPE (Manager uniquement)
  // =========================================================================
  {
    navCap: 'NAV.MANAGEMENT_TEAM',
    roles: ['MANAGER']
  },
  {
    displayName: 'NAV.TEAM_STATS', 
    iconName: 'solar:pie-chart-2-bold-duotone', 
    route: '/statistiques/equipe', 
    roles: ['MANAGER']
  },
  {
    displayName: 'NAV.MY_EMPLOYEES',
    iconName: 'solar:users-group-two-rounded-bold-duotone',
    route: '/management/mes-employes',
    roles: ['MANAGER']
  },
  {
    displayName: 'NAV.ASSIGN_PLANNING',
    iconName: 'solar:calendar-add-bold-duotone',
    route: '/management/assigner-planning',
    roles: ['MANAGER']
  },
  {
    displayName: 'NAV.VALIDATE_REQUESTS',
    iconName: 'solar:document-text-bold-duotone',
    route: '/app-demandes',
    roles: ['MANAGER']
  },

  // =========================================================================
  // 3. GESTION DU TEMPS (Manager & Admin)
  // =========================================================================
  {
    navCap: 'NAV.TIME_MANAGEMENT',
    roles: ['MANAGER', 'ADMIN']
  },
  {
    displayName: 'NAV.GLOBAL_CLOCKINGS',
    iconName: 'solar:history-bold-duotone',
    route: '/pointages',
    roles: ['MANAGER', 'ADMIN']
  },

  // =========================================================================
  // 4. ADMINISTRATION (Admin uniquement)
  // =========================================================================
  { 
    navCap: 'NAV.ADMINISTRATION',
    roles: ['ADMIN']
  },{displayName: 'NAV.MY_PROFILE', 
    iconName: 'solar:user-circle-bold-duotone', 
    route: '/profil',
    roles: ['ADMIN']
  },

  {
    displayName: 'NAV.GLOBAL_VIEW', 
    iconName: 'solar:chart-square-bold-duotone', 
    route: '/statistiques/global', 
    roles: ['ADMIN']
  },
  { 
    displayName: 'NAV.MANAGE_EMPLOYEES', 
    iconName: 'solar:users-group-rounded-bold-duotone', 
    route: '/mes-employes',
    roles: ['ADMIN']
    
  },
  {
    displayName: 'NAV.ORGANIZATIONS', 
    iconName: 'solar:buildings-3-bold-duotone', 
    route: '/app-org-table',
    roles: ['ADMIN']
  },
  {
    displayName: 'NAV.COMPANY_STRUCTURE', 
    iconName: 'solar:diagram-up-bold-duotone', 
    route: '/org-tree', 
    roles: ['ADMIN']
  },{
    displayName: 'NAV.GLOBAL_CLOCKINGS',
    iconName: 'solar:history-bold-duotone',
    route: '/pointages',
    roles: ['ADMIN']
  }
];