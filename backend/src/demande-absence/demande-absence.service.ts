import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service'; // 👈 Ton UploadService Cloudinary
import { CreateDemandeAbsenceDto, TypeDemande } from './dto/create-demande-absence.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class DemandeAbsenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService, // 👈 Injection
  ) {}

  async create(dto: CreateDemandeAbsenceDto, file?: Express.Multer.File) {
    // 1. Vérification de l'employé
    const employe = await this.prisma.employe.findUnique({
      where: { id: dto.employeId },
    });
    if (!employe) {
      throw new NotFoundException(`L'employé avec l'ID ${dto.employeId} n'existe pas.`);
    }

    // 2. Règles métiers selon le type de demande
    if (dto.typeDemande === TypeDemande.CONGE && !dto.type_conge) {
      throw new BadRequestException("Le champ 'type_conge' est requis pour un CONGE.");
    }
    if (dto.typeDemande === TypeDemande.RECUPERATION && dto.heures_a_recuperer === undefined) {
      throw new BadRequestException(
        "Le champ 'heures_a_recuperer' est requis pour une RECUPERATION.",
      );
    }

    // 3. Téléversement vers Cloudinary si un fichier est fourni
    let justificatifUrl: string | null = null;
    if (file) {
      const uploadResult = await this.uploadService.uploadImage(file);
      justificatifUrl = uploadResult.secure_url;
    }

    // 4. Enregistrement en BDD
    return this.prisma.demandeAbsence.create({
      data: {
        typeDemande: dto.typeDemande,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        motif: dto.motif,
        justificatif: justificatifUrl,
        type_conge: dto.type_conge,
        justifie: dto.justifie ?? (file ? true : false),
        heures_a_recuperer: dto.heures_a_recuperer,
        employeId: dto.employeId,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const demande = await this.prisma.demandeAbsence.findUnique({
      where: { id },
      include: { employe: true },
    });
    if (!demande) throw new NotFoundException(`Demande #${id} introuvable.`);
    return demande;
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    await this.findOne(id);
    return this.prisma.demandeAbsence.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.demandeAbsence.delete({ where: { id } });
  }
}
