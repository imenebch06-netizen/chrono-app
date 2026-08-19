import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmployeStatusService {

  calculerEtat(
    empId: any,
    rawPointages: any,
    rawDemandes: any,
    rawPlannings: any,
    dateRefStr: string
  ): { etat: string; libelle: string } {

    const strEmpId = String(empId ?? '').trim();
    const dateCible = this.normaliserDate(dateRefStr);

    if (!strEmpId || strEmpId === 'undefined' || strEmpId === 'null') {
      return { etat: 'REPOS', libelle: 'Repos' };
    }

    // 🟢 1. Extraire les tableaux en gérant les wrappers (res.pointages, res.data, etc.)
    const pointages = this.toArray(rawPointages, 'pointages');
    const demandes = this.toArray(rawDemandes, 'demandes');
    const plannings = this.toArray(rawPlannings, 'plannings');

    // -------------------------------------------------------------------------
    // 🔍 ÉTAPE 1 : POINTAGES (PRÉSENT)
    // -------------------------------------------------------------------------
    const aPointe = pointages.some((p: any) => {
      const pUserId = this.extraireIdUser(p);
      const pDate = this.normaliserDate(p.date || p.createdAt || p.heureDebut || p.heureEntree);
      
      return pUserId === strEmpId && pDate === dateCible;
    });

    if (aPointe) {
      return { etat: 'PRESENT', libelle: 'Présent' };
    }

    // -------------------------------------------------------------------------
    // 🔍 ÉTAPE 2 : DEMANDES D'ABSENCE / CONGÉS
    // -------------------------------------------------------------------------
    const demandeActive = demandes.find((d: any) => {
      const dUserId = this.extraireIdUser(d);
      if (dUserId !== strEmpId) return false;

      // Tolérance sur les statuts de validation
      const statut = String(
        d.statut || d.status || d.statutDemande || d.statut_demande || d.requestStatus || ''
      ).toUpperCase();
      const estValide = !statut || [
        'APPROVED', 'APPROUVE', 'APPROUVEE', 'VALIDE', 'VALID', 'VALIDEE', 'ACCEPTED', 'CONFIRMED'
      ].includes(statut);

      if (!estValide) return false;

      const dDebut = this.normaliserDate(
        d.dateDebut || d.date_debut || d.startDate || d.start_date
      );
      const dFin = this.normaliserDate(
        d.dateFin || d.date_fin || d.endDate || d.end_date || dDebut
      );

      return Boolean(dDebut) && dateCible >= dDebut && dateCible <= dFin;
    });

    if (demandeActive) {
      // Dans demandes.component.ts, la clé est 'typeDemande' ou 'type_conge'
      const type = String(
        demandeActive.typeDemande || demandeActive.type_demande
        || demandeActive.type || demandeActive.type_conge || ''
      ).toUpperCase();

      if (type.includes('CONGE') || type.includes('VACATION')) {
        return { etat: 'CONGE', libelle: 'En Congé' };
      }
      if (type.includes('RECUP') || type.includes('RTT')) {
        return { etat: 'RECUPERATION', libelle: 'Récupération' };
      }
      return { etat: 'ABSENT_JUSTIFIE', libelle: 'Abs. Justifiée' };
    }

    // -------------------------------------------------------------------------
    // 🔍 ÉTAPE 3 : PLANNINGS
    // -------------------------------------------------------------------------
    const planningDuJour = plannings.find((pl: any) => {
      const plUserId = this.extraireIdUser(pl);
      const plDateDebut = this.normaliserDate(
        pl.dateDebut || pl.date || pl.day || pl.datePlanning
      );
      const plDateFin = this.normaliserDate(pl.dateFin || plDateDebut);

      return plUserId === strEmpId
        && dateCible >= plDateDebut
        && dateCible <= plDateFin;
    });

    if (planningDuJour) {
      const typePl = String(
        planningDuJour.type_travail || planningDuJour.type || planningDuJour.statut || ''
      ).toUpperCase();
      if (typePl === 'REPOS' || planningDuJour.isOff === true) {
        return { etat: 'REPOS', libelle: 'Repos' };
      }
      return { etat: 'ABSENT_NON_JUSTIFIE', libelle: 'Abs. Non Justifiée' };
    }

    // Aucun planning n'est affecté pour cette date.
    return { etat: 'NON_ASSIGNEE', libelle: 'Non assignée' };
  }

  // =========================================================================
  // 🛠️ HELPERS DE NORMALISATION ET EXTRACTION
  // =========================================================================

  private toArray(raw: any, key: string): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (raw[key] && Array.isArray(raw[key])) return raw[key];
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.results)) return raw.results;
    if (Array.isArray(raw.demandesValide)) return raw.demandesValide;
    if (raw.data) {
      if (Array.isArray(raw.data)) return raw.data;
      if (raw.data[key] && Array.isArray(raw.data[key])) return raw.data[key];
      if (Array.isArray(raw.data.items)) return raw.data.items;
      if (Array.isArray(raw.data.results)) return raw.data.results;
      if (Array.isArray(raw.data.demandesValide)) return raw.data.demandesValide;
    }
    return [];
  }

  private extraireIdUser(item: any): string {
    if (!item) return '';

    // 1. Si item.employe est un objet { id: 5 } (Cas identifié dans pointages.component.ts)
    const relations = [
      item.employe,
      item.employee,
      item.user,
      item.utilisateur,
      item.demandeur,
      item.personne
    ];
    for (const relation of relations) {
      if (typeof relation === 'object' && relation !== null && relation.id !== undefined) {
        return String(relation.id).trim();
      }
    }
    // 2. Si item.user est un objet { id: 5 }
    // 3. Propriétés directes (employeId, userId, employe, id)
    const raw = item.employeId ?? item.employeeId ?? item.idEmploye
      ?? item.id_employe ?? item.employee_id ?? item.user_id
      ?? item.userId ?? item.idUtilisateur ?? item.employe ?? item.employee;
    return raw !== null && raw !== undefined ? String(raw).trim() : '';
  }

  private normaliserDate(dateInput: any): string {
    if (!dateInput) return '';

    if (dateInput instanceof Date) {
      const a = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const j = String(dateInput.getDate()).padStart(2, '0');
      return `${a}-${m}-${j}`;
    }

    const str = String(dateInput).trim();
    if (str.includes('T')) return str.split('T')[0];

    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    return str.substring(0, 10);
  }
}