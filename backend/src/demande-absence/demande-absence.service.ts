
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


  private async findManagerInHierarchy(orgId: number | null, requestingEmployeId: number): Promise<number | null> {
    let currentOrgId = orgId;

    while (currentOrgId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: currentOrgId },
        select: { id: true, managerId: true, idOrganizationSup: true },
      });

      if (!org) break;

      
      if (org.managerId && org.managerId !== requestingEmployeId) {
        return org.managerId;
      }

     
      currentOrgId = org.idOrganizationSup;
    }

    return null; 
  }
async create(dto: CreateDemandeAbsenceDto, user: any, file?: Express.Multer.File) {
  
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

  
    const compteur = await this.compteurService.getByEmploye(targetEmployeId);

  
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

 

    
    if (dto.typeDemande === TypeDemande.RECUPERATION) {
     
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

 
    const chevauchement = await this.prisma.demandeAbsence.findFirst({
      where: {
        employeId: targetEmployeId,
        status: { in: ['EN_ATTENTE', 'VALIDE'] },
       
        dateDebut: { lte: endDayOnly },
        dateFin: { gte: startDayOnly },
      },
    });

    if (chevauchement) {
      throw new BadRequestException(
        "Une demande (en attente ou validée) existe déjà pour cette date ou cette période."
      );
    }
 


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
    orderBy: [{ employeId: 'desc' }], 
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

  
  const dateDebutStr = String(dto.dateDebut).split('T')[0]; 
  const dateFinStr = String(dto.dateFin).split('T')[0];     

  const heureDebut = planning.heureDebut; 
  const heureFin = planning.heureFin;     


  const synchronizedDateDebut = new Date(`${dateDebutStr}T${heureDebut}:00.000Z`);
  let synchronizedDateFin = new Date(`${dateFinStr}T${heureFin}:00.000Z`);

  
  const [startHours] = heureDebut.split(':').map(Number);
  const [endHours] = heureFin.split(':').map(Number);

  if (startHours >= endHours && dateDebutStr === dateFinStr) {
   
    synchronizedDateFin.setUTCDate(synchronizedDateFin.getUTCDate() + 1);
  }


  if (dto.typeDemande === TypeDemande.CONGE && !dto.type_conge) {
    throw new BadRequestException("Le champ 'type_conge' est requis pour un CONGE.");
  }
  if (dto.typeDemande === TypeDemande.RECUPERATION && dto.heures_a_recuperer === undefined) {
    throw new BadRequestException("Le champ 'heures_a_recuperer' est requis pour une RECUPERATION.");
  }

 
  let justificatifUrl: string | null = null;
  if (file) {
    const uploadResult = await this.uploadService.uploadImage(file);
    justificatifUrl = uploadResult.secure_url;
  }

  
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


  const isOwner = demande.employeId === userId;
  const isAdmin = user?.role === Role.ADMIN;


  let isHierarchicalManager = false;
  if (user?.isManager) {
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId: userId },
    });

  
    const employePath = demande.employe.organization?.path;
    const managerPath = managedOrg?.path;

    
    if (employePath && managerPath) {
      isHierarchicalManager = employePath.startsWith(managerPath);
    }
  }

 
  if (!isOwner && !isHierarchicalManager && !isAdmin) {
    throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette demande.");
  }

  return demande;
}

 async updateStatus(id: number, dto: UpdateStatusDto, user: any) {

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

 
  if (demande.employeId === user.id) {
    throw new ForbiddenException('Vous ne pouvez pas valider ou refuser votre propre demande.');
  }

  
  if (user.role !== Role.ADMIN) {
   
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId: user.id },
    });

    if (!managedOrg) {
      throw new ForbiddenException("Vous n'êtes responsable d'aucune organisation.");
    }

   
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

 
    if (dto.status === 'VALIDE' && demande.status !== 'VALIDE') {
      if (demande.typeDemande === 'CONGE') {
      
        const diffMs = Math.abs(demande.dateFin.getTime() - demande.dateDebut.getTime());
        const nbJours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        await this.compteurService.deduireConges(demande.employeId, nbJours);
      } else if (demande.typeDemande === 'RECUPERATION') {
        const nbHeures = demande.heures_a_recuperer || 0;
        await this.compteurService.deduireRtt(demande.employeId, nbHeures);
      }
    }

    const updatedDemande = await this.prisma.demandeAbsence.update({
      where: { id },
      data: { status: dto.status },
    });

 
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

  const managedOrg = await this.prisma.organization.findFirst({
    where: { managerId },
  });

  if (!managedOrg || !managedOrg.path) {
    return [];
  }

 
  return this.prisma.demandeAbsence.findMany({
    where: {
      status: 'EN_ATTENTE',
      employeId: { not: managerId }, 
      employe: {
        organization: {
          path: {
            startsWith: managedOrg.path, 
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

 
  if (demande.employeId !== employeId) {
    throw new ForbiddenException("Vous ne pouvez pas annuler la demande d'un autre employé.");
  }

  if (demande.status !== 'EN_ATTENTE') {
    throw new BadRequestException('Impossible d annuler une demande déjà traitée.');
  }

  return this.prisma.demandeAbsence.delete({
    where: { id: demandeId },
  });
}
async findAllApprovedTeam(managerId: number) {


  const managedOrg = await this.prisma.organization.findFirst({
    where: { managerId },
  });

  if (!managedOrg || !managedOrg.path) {
    return [];
  }

 
  return this.prisma.demandeAbsence.findMany({
    where: {
      status: 'VALIDE',
      employeId: { not: managerId },
      employe: {
        organization: {
          path: {
            startsWith: managedOrg.path,
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

}
