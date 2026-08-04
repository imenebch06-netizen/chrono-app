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

@Injectable()
export class DemandeAbsenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

 async create(dto: CreateDemandeAbsenceDto, user: any, file?: Express.Multer.File) {
    // 1. Récupération sécurisée de l'ID utilisateur (compatible `user.id` et `user.sub`)
    const currentUserId = user?.id ?? user?.sub;

    // 2. Détermination de l'employeId cible
    const rawEmployeId = (user?.role === Role.ADMIN && dto.employeId) 
      ? dto.employeId 
      : currentUserId;

    const targetEmployeId = Number(rawEmployeId);

    // 3. Vérification de la validité de l'ID
    if (!targetEmployeId || isNaN(targetEmployeId)) {
      throw new BadRequestException(
        "Impossible d'identifier l'employé pour cette demande. Vérifiez l'ID de l'utilisateur.",
      );
    }

    // 4. Vérification de l'existence de l'employé en BDD
    const employe = await this.prisma.employe.findUnique({
      where: { id: targetEmployeId },
    });

    if (!employe) {
      throw new NotFoundException(`L'employé avec l'ID ${targetEmployeId} n'existe pas.`);
    }

    // 5. Règles métiers selon le type de demande
    if (dto.typeDemande === TypeDemande.CONGE && !dto.type_conge) {
      throw new BadRequestException("Le champ 'type_conge' est requis pour un CONGE.");
    }
    if (dto.typeDemande === TypeDemande.RECUPERATION && dto.heures_a_recuperer === undefined) {
      throw new BadRequestException("Le champ 'heures_a_recuperer' est requis pour une RECUPERATION.");
    }

    // 6. Téléversement Cloudinary si un justificatif est fourni
    let justificatifUrl: string | null = null;
    if (file) {
      const uploadResult = await this.uploadService.uploadImage(file);
      justificatifUrl = uploadResult.secure_url;
    }

    // 7. Enregistrement en BDD
    return this.prisma.demandeAbsence.create({
      data: {
        typeDemande: dto.typeDemande,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        motif: dto.motif,
        justificatif: justificatifUrl,
        type_conge: dto.type_conge,
        justifie: dto.justifie ?? (file ? true : false),
        heures_a_recuperer: dto.heures_a_recuperer ? Number(dto.heures_a_recuperer) : null,
        employeId: targetEmployeId,
      },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
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

  async findOne(id: number, user: any) {
    const demande = await this.prisma.demandeAbsence.findUnique({
      where: { id },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true, serviceId: true, role: true },
        },
      },
    });

    if (!demande) {
      throw new NotFoundException(`Demande d'absence #${id} introuvable.`);
    }

    // 🔒 Contrôle d'accès :
    const isOwner = demande.employeId === user.id;
    const isSameServiceManager = user.role === Role.MANAGER && demande.employe.serviceId === user.serviceId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isSameServiceManager && !isAdmin) {
      throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette demande.");
    }

    return demande;
  }

  async updateStatus(id: number, dto: UpdateStatusDto, user: any) {
  // 1. Récupération de la demande avec l'employé concerné
  const demande = await this.prisma.demandeAbsence.findUnique({
    where: { id },
    include: { employe: true },
  });

  if (!demande) {
    throw new NotFoundException(`Demande #${id} introuvable.`);
  }

  // 🔒 2. CONTRÔLE DE SÉCURITÉ

  // Interdiction de valider sa propre demande
  if (demande.employeId === user.id) {
    throw new ForbiddenException("Vous ne pouvez pas valider ou refuser votre propre demande.");
  }

  // Règles pour le rôle MANAGER
  if (user.role === Role.MANAGER) {
    
    // CAS A : La demande appartient à un autre MANAGER (Validation entre pairs)
    if (demande.employe.role === Role.MANAGER) {
      // ✅ Autorisé
    } 
    // CAS B : La demande appartient à un EMPLOYE simple
    else {
      const isSubordonneDirect = demande.employe.managerId === user.id;
      const isMemeService = demande.employe.serviceId === user.serviceId;

      // Si l'employé n'est ni son subordonné direct, ni dans son service : BLOQUER
      if (!isSubordonneDirect && !isMemeService) {
        throw new ForbiddenException(
          "Vous n'avez pas les droits sur cet employé (ni subordonné direct, ni membre de votre service)."
        );
      }
    }
  }

  // 3. Déduction du solde dans Compteur si la demande passe à VALIDE
  if (dto.status === 'VALIDE' && demande.status !== 'VALIDE') {
    const compteur = await this.prisma.compteur.findFirst({
      where: { employeId: demande.employeId },
    });

    if (compteur) {
      if (demande.typeDemande === TypeDemande.RECUPERATION) {
        const heuresDeduites = demande.heures_a_recuperer || 0;
        const nouveauSoldeRtt = Math.max(0, compteur.solde_rtt - heuresDeduites);

        await this.prisma.compteur.update({
          where: { id: compteur.id },
          data: { solde_rtt: nouveauSoldeRtt },
        });

      } else if (demande.typeDemande === TypeDemande.ABSENCE || demande.typeDemande === TypeDemande.CONGE) {
        const debut = new Date(demande.dateDebut);
        const fin = new Date(demande.dateFin);
        const diffMs = Math.abs(fin.getTime() - debut.getTime());
        const nbJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1;

        const nouveauSoldeConges = Math.max(0, compteur.solde_conges - nbJours);

        await this.prisma.compteur.update({
          where: { id: compteur.id },
          data: { solde_conges: nouveauSoldeConges },
        });
      }
    }
  }

  // 4. Mise à jour du statut
  return this.prisma.demandeAbsence.update({
    where: { id },
    data: { status: dto.status },
  });
}

  async remove(id: number) {
    const demande = await this.prisma.demandeAbsence.findUnique({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande #${id} introuvable.`);
    return this.prisma.demandeAbsence.delete({ where: { id } });
  }

  async findByService(serviceId: number) {
    return this.prisma.demandeAbsence.findMany({
      where: { employe: { serviceId } },
      include: {
        employe: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDemandesManagers() {
    return this.prisma.demandeAbsence.findMany({
      where: { employe: { role: Role.MANAGER } },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            service: { select: { id: true, nom_service: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}