// --- 1. MES STATS PERSONNELLES ---
export interface PersonalStats {
  soldeConges: number;
  soldeRtt: number;
  creditDebitHeures: number;
  tauxPresence: number;
  demandesParStatut: {
    enAttente: number;
    validees: number;
    refusees: number;
  };
  repartitionAbsences: {
    conges: number;
    absences: number;
    recuperations: number;
  };
  evolutionHeuresMensuel: {
    mois: string[];
    heuresTravaillees: number[];
    creditDebit: number[];
  };
}

// --- 2. STATS ÉQUIPE (MANAGER) ---
export interface TeamStats {
  organizationNom: string;
  totalSubordonnes: number;
  presentsAujourdhui: number;
  enCongeAujourdhui: number;
  demandesEnAttenteValidation: number;
  absencesParType: {
    labels: string[];
    series: number[];
  };
  membresSummary: MembreStatSummary[];
}

export interface MembreStatSummary {
  employeId: number;
  nomComplet: string;
  email: string;
  soldeConges: number;
  soldeRtt: number;
  creditDebit: number;
  statutAujourdhui: 'PRESENT' | 'CONGE' | 'ABSENT';
}

// --- 3. STATS GLOBALES (ADMIN) ---
export interface AdminGlobalStats {
  totalEmployes: number;
  totalOrganizations: number;
  tauxPresenceGlobal: number;
  demandesEnAttenteTotales: number;
  repartitionDemandesGlobales: {
    labels: string[];
    series: number[];
  };
}