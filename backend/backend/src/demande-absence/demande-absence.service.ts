
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateDemandeAbsenceDto, TypeDemande } from './dto/create-demande-absence.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Role } from '../auth/enums/role.enum';
import { CompteurService } from 'src/compteur/compteur.service';

@Injectable()
export class DemandeAbsenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly compteurService: CompteurService,
  ) {}


  // =========================================================================
  // 🔍 HELPER PRIVÉ : Remontée de l'arbre pour trouver le 1er Manager disponible
  // =========================================================================
  private async findManagerInHierarchy(orgId: number | null, requestingEmployeId: number): Promise<number | null> {
    let currentOrgId = orgId;

    while (currentOrgId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: currentOrgId },
        select: { id: true, managerId: true, idOrganizationSup: true },
      });

      if (!org) break;

      // Si l'organisation possède un manager ET que ce n'est pas le demandeur lui-même
      if (org.managerId && org.managerId !== requestingEmployeId) {
        return org.managerId;
      }

      // Remontée vers l'organisation parente (ancêtre)
      currentOrgId = org.idOrganizationSup;
    }

    return null; // Aucun manager trouvé dans toute la hiérarchie ascendante
  }
async create(dto: CreateDemandeAbsenceDto, user: any, file?: Express.Multer.File) {
  // 1. Récupération de l'employé et de son organisation
  const currentUserId = user?.id ?? user?.sub;
  const rawEmployeId = user?.role === Role.ADMIN && dto.employeId ? dto.employeId : currentUserId;
  const targetEmployeId = Number(rawEmployeId);

  if (!targetEmployeId || isNaN(targetEmployeId)) {
    throw new BadRequestException("Impossible d'identifier l'employé pour cette demande.");
  }

  const employe = await this.prisma.employe.findUnique({
    where: { id: targetEmployeId },
    include: { organization: true },
  });

  if (!employe) {
    throw new NotFoundException(`L'employé avec l'ID ${targetEmployeId} n'existe pas.`);
  }

   // 🆕 1.bis RÉCUPÉRATION DU COMPTEUR
    const compteur = await this.compteurService.getByEmploye(targetEmployeId);

   // 2. Normalisation des dates au jour J (00:00:00) pour la comparaison
  const rawDateDebut = new Date(dto.dateDebut);
  const rawDateFin = dto.typeDemande === TypeDemande.RECUPERATION 
      ? new Date(dto.dateDebut) 
      : new Date(dto.dateFin);

  const startDayOnly = new Date(rawDateDebut);
  startDayOnly.setHours(0, 0, 0, 0);

  const endDayOnly = new Date(rawDateFin);
  endDayOnly.setHours(0, 0, 0, 0);

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const demain = new Date(aujourdhui);
  demain.setDate(demain.getDate() + 1);

  if (startDayOnly < demain) {
    throw new BadRequestException("La demande doit être faite au moins 24h à l'avance.");
  }
  if (endDayOnly < startDayOnly) {
    throw new BadRequestException("La date de fin ne peut pas être antérieure à la date de début.");
  }

 

    // 🆕 2. CONTRÔLES MÉTIER POUR LA RÉCUPÉRATION
    if (dto.typeDemande === TypeDemande.RECUPERATION) {
      // Pour une récupération, dateFin est égale à dateDebut
      dto.dateFin = dto.dateDebut;

      const hrs = Number(dto.heures_a_recuperer);
      if (!hrs || hrs <= 0) {
        throw new BadRequestException("Veuillez spécifier un nombre d'heures à récupérer valide (supérieur à 0).");
      }

      if (hrs > 8) {
        throw new BadRequestException("Le nombre d'heures à récupérer ne peut pas dépasser la journée théorique de 8 heures.");
      }

      if (compteur.solde_rtt < hrs) {
        throw new BadRequestException(
          `Solde RTT insuffisant (${compteur.solde_rtt} h disponible(s), ${hrs} h demandée(s)).`
        );
      }
    }
    if (dto.typeDemande === TypeDemande.CONGE) {
      // Calcul du nombre de jours calendaires (inclusif)
      const diffTime = endDayOnly.getTime() - startDayOnly.getTime();
      const nbJours = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;

      if (compteur.solde_conges <= 0) {
        throw new BadRequestException("Votre solde de congés payés est épuisé (0 jour disponible).");
      }
      if (compteur.solde_conges < nbJours) {
        throw new BadRequestException(
          `Solde de congés insuffisant (${compteur.solde_conges} jour(s) disponible(s), ${nbJours} jour(s) demandé(s)).`
        );
      }
    }

    // 5. 🚫 CONTRAINTE STRICTE : AUCUN CHEVAUCHEMENT DE DEMANDES
    const chevauchement = await this.prisma.demandeAbsence.findFirst({
      where: {
        employeId: targetEmployeId,
        status: { in: ['EN_ATTENTE', 'VALIDE'] },
        // Intersect : début_existant <= fin_nouvelle ET fin_existante >= début_nouveau
        dateDebut: { lte: endDayOnly },
        dateFin: { gte: startDayOnly },
      },
    });

    if (chevauchement) {
      throw new BadRequestException(
        "Une demande (en attente ou validée) existe déjà pour cette date ou cette période."
      );
    }
 

  // 3. 🚫 CONTRAINTE STRICTE : Si AUCUN planning trouvé -> On lève une erreur HTTP 400
  const planning = await this.prisma.planning.findFirst({
    where: {
      AND: [
        { dateDebut: { lte: rawDateDebut } },
        { dateFin: { gte: rawDateFin } },
        {
          OR: [
            { employeId: targetEmployeId },
          ],
        },
      ],
    },
    orderBy: [{ employeId: 'desc' }], // Priorité au planning individuel
  });

  if (!planning) {
    throw new BadRequestException(
      "Impossible d'effectuer la demande : Vous ne possédez aucun planning attribué pour cette période."
    );
  }

  if (!planning.heureDebut || !planning.heureFin) {
    throw new BadRequestException(
      "Le planning sélectionné n'a pas d'heures définies. Veuillez contacter le service RH."
    );
  }

  // 4. ⏰ SYNCHRONISATION DES HEURES DU PLANNING (UTC Strict sans décalage timezone)
  
 // 4. ⏰ SYNCHRONISATION DES HEURES DU PLANNING (Infaillible)
  
  // 💡 ASTUCE : On découpe DIRECTEMENT le string du DTO sans utiliser new Date()
  // Cela empêche JavaScript d'appliquer le moindre décalage horaire préalable.
  const dateDebutStr = String(dto.dateDebut).split('T')[0]; // Résultat garanti : "YYYY-MM-DD"
  const dateFinStr = String(dto.dateFin).split('T')[0];     // Résultat garanti : "YYYY-MM-DD"

  const heureDebut = planning.heureDebut; // Ex: "08:00"
  const heureFin = planning.heureFin;     // Ex: "16:00"

  // Assemblage ISO strict en UTC
  const synchronizedDateDebut = new Date(`${dateDebutStr}T${heureDebut}:00.000Z`);
  let synchronizedDateFin = new Date(`${dateFinStr}T${heureFin}:00.000Z`);

  // Shift de nuit (ex: 22h00 -> 06h00 le lendemain)
  const [startHours] = heureDebut.split(':').map(Number);
  const [endHours] = heureFin.split(':').map(Number);

  if (startHours >= endHours && dateDebutStr === dateFinStr) {
    // La fin du shift glisse automatiquement au lendemain (+1 jour UTC)
    synchronizedDateFin.setUTCDate(synchronizedDateFin.getUTCDate() + 1);
  }

  // 5. Règles métiers
  if (dto.typeDemande === TypeDemande.CONGE && !dto.type_conge) {
    throw new BadRequestException("Le champ 'type_conge' est requis pour un CONGE.");
  }
  if (dto.typeDemande === TypeDemande.RECUPERATION && dto.heures_a_recuperer === undefined) {
    throw new BadRequestException("Le champ 'heures_a_recuperer' est requis pour une RECUPERATION.");
  }

  // 6. Upload du justificatif
  let justificatifUrl: string | null = null;
  if (file) {
    const uploadResult = await this.uploadService.uploadImage(file);
    justificatifUrl = uploadResult.secure_url;
  }

  // 7. Création de la demande synchronisée avec le planning
  const newDemande = await this.prisma.demandeAbsence.create({
    data: {
      typeDemande: dto.typeDemande,
      dateDebut: synchronizedDateDebut,
      dateFin: synchronizedDateFin,
      motif: dto.motif,
      justificatif: justificatifUrl,
      type_conge: dto.type_conge,
      justifie: dto.justifie ?? (file ? true : false),
      heures_a_recuperer: dto.heures_a_recuperer ? Number(dto.heures_a_recuperer) : null,
      employeId: targetEmployeId,
      planningId: planning.id,
    },
    include: {
      employe: { select: { id: true, nom: true, prenom: true, email: true } },
      planning: true,
    },
  });

  // 2. 🔔 NOTIFICATION : Recherche du Manager (Arbre hiérarchique)
    const managerId = await this.findManagerInHierarchy(employe.organizationId, targetEmployeId);

    if (managerId) {
      await this.prisma.notification.create({
        data: {
          titre: "Nouvelle demande d'absence",
          message: `${employe.prenom} ${employe.nom} a soumis une demande de ${dto.typeDemande}.`,
          type: 'DEMANDE_CREEE',
          employeId: managerId,
          demandeId: newDemande.id,
        },
      });
    }

    return newDemande;

}
  async findAll() {
    return this.prisma.demandeAbsence.findMany({
      include: { employe: { select: { id: true, nom: true, prenom: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmploye(employeId: number) {
    return this.prisma.demandeAbsence.findMany({
      where: { employeId },
      include: { employe: { select: { id: true, nom: true, prenom: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
async findAllPending() {
  return this.prisma.demandeAbsence.findMany({
    where: { status: 'EN_ATTENTE' },
    include: {
      employe: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          organization: { select: { id: true, nom: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
 async findOne(id: number, user: any) {
  const userId = user?.id ?? user?.sub;

  // 1. Récupération de la demande avec l'organisation de l'employé
  const demande = await this.prisma.demandeAbsence.findUnique({
    where: { id },
    include: {
      employe: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          organization: {
            select: { id: true, nom: true, path: true },
          },
        },
      },
    },
  });

  if (!demande) {
    throw new NotFoundException(`Demande d'absence #${id} introuvable.`);
  }

  // 🔒 2. Contrôle d'accès
  const isOwner = demande.employeId === userId;
  const isAdmin = user?.role === Role.ADMIN;

  // Vérification si l'utilisateur est le manager de cette branche hiérarchique
  let isHierarchicalManager = false;
  if (user?.isManager) {
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId: userId },
    });

   // 🔑 Extrait et sécurise les chemins
    const employePath = demande.employe.organization?.path;
    const managerPath = managedOrg?.path;

    // S'assure que les deux chemins sont des strings non nulles
    if (employePath && managerPath) {
      isHierarchicalManager = employePath.startsWith(managerPath);
    }
  }

  // Si l'utilisateur n'est ni le propriétaire, ni son manager hiérarchique, ni l'admin
  if (!isOwner && !isHierarchicalManager && !isAdmin) {
    throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette demande.");
  }

  return demande;
}

 async updateStatus(id: number, dto: UpdateStatusDto, user: any) {
  // 1. Récupérer la demande avec l'organisation de l'employé
  const demande = await this.prisma.demandeAbsence.findUnique({
    where: { id },
    include: {
      employe: {
        include: { organization: true },
      },
    },
  });

  if (!demande) {
    throw new NotFoundException(`Demande #${id} introuvable.`);
  }

  // 🔒 2. CONTRÔLE DE SÉCURITÉ

  // Interdiction de valider/refuser sa propre demande
  if (demande.employeId === user.id) {
    throw new ForbiddenException('Vous ne pouvez pas valider ou refuser votre propre demande.');
  }

  // Si l'utilisateur n'est PAS ADMIN, on contrôle la responsabilité hiérarchique
  if (user.role !== Role.ADMIN) {
    // Récupérer l'organisation dont l'utilisateur courant est le responsable
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId: user.id },
    });

    if (!managedOrg) {
      throw new ForbiddenException("Vous n'êtes responsable d'aucune organisation.");
    }

    // Vérifier si l'employé demandeur appartient à cette organisation ou à une sous-branche
   const employePath = demande.employe.organization?.path;
    const managerPath = managedOrg.path;
    const isSubordinate =
      Boolean(employePath) &&
      Boolean(managerPath) &&
      employePath!.startsWith(managerPath!);

    if (!isSubordinate) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits sur cet employé (il n'est pas dans votre arbre hiérarchique).",
      );
    }
  }

  // 3. DÉDUCTION DU SOLDE EN CAS DE VALIDATION
    if (dto.status === 'VALIDE' && demande.status !== 'VALIDE') {
      if (demande.typeDemande === 'CONGE') {
        // Calcul de la durée en jours
        const diffMs = Math.abs(demande.dateFin.getTime() - demande.dateDebut.getTime());
        const nbJours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        await this.compteurService.deduireConges(demande.employeId, nbJours);
      } else if (demande.typeDemande === 'RECUPERATION') {
        const nbHeures = demande.heures_a_recuperer || 0;
        await this.compteurService.deduireRtt(demande.employeId, nbHeures);
      }
    }

    // Mise à jour du statut
    const updatedDemande = await this.prisma.demandeAbsence.update({
      where: { id },
      data: { status: dto.status },
    });

    // 🔔 NOTIFICATION : Envoie le résultat à l'employé demandeur
    const isValide = dto.status === 'VALIDE';
    const statutTexte = isValide ? 'validée' : 'refusée';

    await this.prisma.notification.create({
      data: {
        titre: isValide ? 'Demande Validée' : 'Demande Refusée',
        message: `Votre demande de ${demande.typeDemande} a été ${statutTexte}.`,
        type: isValide ? 'DEMANDE_VALIDEE' : 'DEMANDE_REFUSEE',
        employeId: demande.employeId,
        demandeId: demande.id,
      },
    });

    return updatedDemande;
  }

  async remove(id: number) {
    const demande = await this.prisma.demandeAbsence.findUnique({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande #${id} introuvable.`);
    return this.prisma.demandeAbsence.delete({ where: { id } });
  }

  async findPendingForManager(managerId: number) {
  // 1. Trouver l'organisation gérée par ce manager
  const managedOrg = await this.prisma.organization.findFirst({
    where: { managerId },
  });

  if (!managedOrg || !managedOrg.path) {
    return [];
  }

  // 2. Récupérer les demandes en attente des employés dans son arbre hiérarchique
  return this.prisma.demandeAbsence.findMany({
    where: {
      status: 'EN_ATTENTE',
      employeId: { not: managerId }, // Exclure ses propres demandes
      employe: {
        organization: {
          path: {
            startsWith: managedOrg.path, // 🔑 Tous les subordonnés directs et indirects
          },
        },
      },
    },
    include: {
      employe: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          organization: { select: { id: true, nom: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

  async cancelOwnDemande(demandeId: number, employeId: number) {
  const demande = await this.prisma.demandeAbsence.findUnique({
    where: { id: demandeId },
  });

  if (!demande) {
    throw new NotFoundException('Demande introuvable.');
  }

  // Sécurité : Vérifier que la demande appartient bien à cet employé
  if (demande.employeId !== employeId) {
    throw new ForbiddenException("Vous ne pouvez pas annuler la demande d'un autre employé.");
  }

  // Règle métier : Annulable UNIQUEMENT si encore EN_ATTENTE
  if (demande.status !== 'EN_ATTENTE') {
    throw new BadRequestException('Impossible d annuler une demande déjà traitée.');
  }

  return this.prisma.demandeAbsence.delete({
    where: { id: demandeId },
  });
}


}
