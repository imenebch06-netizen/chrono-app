import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmployeStatusService {

  private readonly HEURE_FIN_PAR_DEFAUT_MIN = 17 * 60; 

  private readonly CLES_HEURE_DEBUT = ['heureDebut', 'heure_debut', 'debutTravail', 'debut_travail', 'startTime', 'start_time'];
  private readonly CLES_HEURE_FIN = ['heureFin', 'heure_fin', 'finTravail', 'fin_travail', 'endTime', 'end_time'];

  calculerEtat(
    empId: any,
    rawPointages: any,
    rawDemandes: any,
    rawPlannings: any,
    dateRefStr: string,
    now: Date = new Date()
  ): { etat: string; libelle: string } {

    const strEmpId = String(empId ?? '').trim();
    const dateCible = this.normaliserDate(dateRefStr);

    if (!strEmpId || strEmpId === 'undefined' || strEmpId === 'null') {
      return { etat: 'REPOS', libelle: 'Repos' };
    }

    const pointages = this.toArray(rawPointages, 'pointages');
    const demandes = this.toArray(rawDemandes, 'demandes');
    const plannings = this.toArray(rawPlannings, 'plannings');

    const fenetre = this.resoudreFenetreActive(strEmpId, plannings, dateCible, now);
    const dateEffectivePointage = fenetre?.dateEffective ?? dateCible;

   
    const aPointe = pointages.some((p: any) => {
      const pUserId = this.extraireIdUser(p);
      const pDate = this.normaliserDate(p.date || p.createdAt || p.heureDebut || p.heureEntree);
      return pUserId === strEmpId && pDate === dateEffectivePointage;
    });

    if (aPointe) {
      return { etat: 'PRESENT', libelle: 'Présent' };
    }

  
    const demandesEmploye = demandes.filter((d: any) =>
      this.extraireIdUser(d) === strEmpId && this.estDemandeValidee(d)
    );

    const demandeActive = demandesEmploye.find((d: any) => {
      const debut = this.parseTimestamp(d.dateDebut || d.date_debut || d.startDate || d.start_date);
      const fin = this.parseTimestamp(d.dateFin || d.date_fin || d.endDate || d.end_date) ?? debut;
      if (!debut || !fin) return false;
      return now.getTime() >= debut.getTime() && now.getTime() <= fin.getTime();
    });

    if (demandeActive) {
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

   
    const demandeAujourdhuiTerminee = demandesEmploye.find((d: any) => {
      const debutDate = this.normaliserDate(d.dateDebut || d.date_debut || d.startDate || d.start_date);
      const finDate = this.normaliserDate(d.dateFin || d.date_fin || d.endDate || d.end_date || debutDate);
      const couvreAujourdhui = Boolean(debutDate) && dateCible >= debutDate && dateCible <= finDate;
      if (!couvreAujourdhui) return false;

      const finTimestamp = this.parseTimestamp(d.dateFin || d.date_fin || d.endDate || d.end_date);
      return finTimestamp !== null && now.getTime() > finTimestamp.getTime();
    });

    if (demandeAujourdhuiTerminee) {
      return { etat: 'REPOS', libelle: 'Repos' };
    }

    if (!fenetre || !fenetre.planning) {
     
      return { etat: 'NON_ASSIGNEE', libelle: 'Non assignée' };
    }

    if (this.estJourRepos(fenetre.planning, fenetre.dateEffective)) {
      return { etat: 'REPOS', libelle: 'Repos' };
    }

    
    if (fenetre.estNocturne && fenetre.dateEffective !== dateCible) {
      return { etat: 'ABSENT_NON_JUSTIFIE', libelle: 'Abs. Non Justifiée' };
    }

    if (fenetre.debutMin === null) {
      
      const finDefaut = fenetre.finMin ?? this.HEURE_FIN_PAR_DEFAUT_MIN;
      const nowMin = now.getHours() * 60 + now.getMinutes();
      return nowMin < finDefaut
        ? { etat: 'REPOS', libelle: 'Repos' }
        : { etat: 'ABSENT_NON_JUSTIFIE', libelle: 'Abs. Non Justifiée' };
    }

    const nowMin = now.getHours() * 60 + now.getMinutes();

    if (nowMin < fenetre.debutMin) {
      
      return { etat: 'REPOS', libelle: 'Repos' };
    }

    
    return { etat: 'ABSENT_NON_JUSTIFIE', libelle: 'Abs. Non Justifiée' };
  }

  

  private resoudreFenetreActive(
    empId: string,
    plannings: any[],
    dateCible: string,
    now: Date
  ): { planning: any; dateEffective: string; debutMin: number | null; finMin: number | null; estNocturne: boolean } | null {

    const trouverPlanning = (dateStr: string) => plannings.find((pl: any) => {
      const plUserId = this.extraireIdUser(pl);
      const plDateDebut = this.normaliserDate(pl.dateDebut || pl.date || pl.day || pl.datePlanning);
      const plDateFin = this.normaliserDate(pl.dateFin || plDateDebut);
      return plUserId === empId && dateStr >= plDateDebut && dateStr <= plDateFin;
    });

    const nowMin = now.getHours() * 60 + now.getMinutes();
    const hierStr = this.decalerDate(dateCible, -1);

    const planningHier = trouverPlanning(hierStr);
    if (planningHier && !this.estJourRepos(planningHier, hierStr)) {
      const debutHier = this.extraireHeureEnMinutes(planningHier, this.CLES_HEURE_DEBUT);
      const finHier = this.extraireHeureEnMinutes(planningHier, this.CLES_HEURE_FIN);

      if (debutHier !== null && finHier !== null && debutHier >= finHier && nowMin < finHier) {
        return {
          planning: planningHier,
          dateEffective: hierStr,
          debutMin: debutHier,
          finMin: finHier,
          estNocturne: true,
        };
      }
    }

    const planningAuj = trouverPlanning(dateCible);
    if (!planningAuj) return null;

    if (this.estJourRepos(planningAuj, dateCible)) {
      return { planning: planningAuj, dateEffective: dateCible, debutMin: null, finMin: null, estNocturne: false };
    }

    const debut = this.extraireHeureEnMinutes(planningAuj, this.CLES_HEURE_DEBUT);
    const fin = this.extraireHeureEnMinutes(planningAuj, this.CLES_HEURE_FIN);
    const estNocturne = debut !== null && fin !== null && debut >= fin;

    return {
      planning: planningAuj,
      dateEffective: dateCible,
      debutMin: debut,
      finMin: fin ?? this.HEURE_FIN_PAR_DEFAUT_MIN,
      estNocturne,
    };
  }

 

  private estDemandeValidee(d: any): boolean {
    const statut = String(
      d.statut || d.status || d.statutDemande || d.statut_demande || d.requestStatus || ''
    ).toUpperCase();
    return !statut || [
      'APPROVED', 'APPROUVE', 'APPROUVEE', 'VALIDE', 'VALID', 'VALIDEE', 'ACCEPTED', 'CONFIRMED'
    ].includes(statut);
  }

  private parseTimestamp(dateInput: any): Date | null {
    if (!dateInput) return null;
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  

  getLibelleEtatKey(etat: string): string {
    const cles: Record<string, string> = {
      PRESENT: 'EMPLOYEE_TABLE.STATUS.PRESENT',
      CONGE: 'EMPLOYEE_TABLE.STATUS.ON_LEAVE',
      RECUPERATION: 'EMPLOYEE_TABLE.STATUS.RECOVERY',
      REPOS: 'EMPLOYEE_TABLE.STATUS.REST',
      ABSENT_JUSTIFIE: 'EMPLOYEE_TABLE.STATUS.JUSTIFIED_ABSENCE',
      ABSENT_NON_JUSTIFIE: 'EMPLOYEE_TABLE.STATUS.UNJUSTIFIED_ABSENCE',
      NON_ASSIGNEE: 'EMPLOYEE_TABLE.STATUS.NOT_ASSIGNED',
    };
    return cles[etat] ?? 'EMPLOYEE_TABLE.STATUS.NOT_ASSIGNED';
  }

  getColorClasseEtat(etat: string): string {
    const couleurs: Record<string, string> = {
      PRESENT: 'text-success',
      CONGE: 'text-primary',
      RECUPERATION: 'text-info',
      REPOS: 'text-secondary',
      ABSENT_JUSTIFIE: 'text-warning',
      ABSENT_NON_JUSTIFIE: 'text-error',
      NON_ASSIGNEE: 'text-warning',
    };
    return couleurs[etat] ?? 'text-secondary';
  }

  
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
    const relations = [item.employe, item.employee, item.user, item.utilisateur, item.demandeur, item.personne];
    for (const relation of relations) {
      if (typeof relation === 'object' && relation !== null && relation.id !== undefined) {
        return String(relation.id).trim();
      }
    }
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

  private decalerDate(dateStr: string, deltaJours: number): string {
    const [annee, mois, jour] = dateStr.split('-').map(Number);
    const d = new Date(annee, (mois || 1) - 1, jour || 1);
    d.setDate(d.getDate() + deltaJours);
    const a = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${a}-${m}-${j}`;
  }

  private estJourRepos(planning: any, dateStr: string): boolean {
    if (this.estJourDeRepoHebdo(planning, dateStr)) return true;

    const typePl = String(
      planning.type_travail || planning.typeTravail || planning.type || planning.statut || ''
    ).toUpperCase();

    return (
      planning.isOff === true ||
      planning.estRepos === true ||
      planning.dayOff === true ||
      typePl.includes('REPOS') ||
      typePl.includes('OFF') ||
      typePl.includes('WEEKEND') ||
      typePl.includes('WEEK_END') ||
      typePl.includes('FERIE') ||
      typePl.includes('CONGE_HEBDO')
    );
  }

  private estJourDeRepoHebdo(planning: any, dateCibleStr: string): boolean {
    const joursRepos = this.parseJoursRepos(planning.joursRepos);
    if (joursRepos.length === 0) return false;

    const [annee, mois, jour] = dateCibleStr.split('-').map(Number);
    if (!annee || !mois || !jour) return false;

    const jourSemaine = new Date(annee, mois - 1, jour).getDay();
    return joursRepos.includes(jourSemaine);
  }

  private parseJoursRepos(raw: string | number[] | undefined | null): number[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(Number).filter(n => !isNaN(n));

    const str = String(raw).trim();

    if (str.startsWith('[')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return parsed.map(Number).filter(n => !isNaN(n));
        }
      } catch {
        
      }
    }

    return str
      .replace(/[\[\]"]/g, '')
      .split(/[\s,;-]+/)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n));
  }

  private extraireHeureEnMinutes(item: any, keys: string[]): number | null {
    for (const key of keys) {
      const val = item[key];
      if (!val) continue;
      const str = String(val).trim();
      const match = str.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
    }
    return null;
  }
}