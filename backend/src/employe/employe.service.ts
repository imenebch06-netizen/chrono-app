import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';

@Injectable()
export class EmployeService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREATE
  async create(createEmployeDto: CreateEmployeDto) {
    const existing = await this.prisma.employe.findUnique({
      where: { email: createEmployeDto.email },
    });

    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé.');
    }

    const hashedPassword = await bcrypt.hash(createEmployeDto.password, 10);

    return this.prisma.employe.create({
      data: {
        ...createEmployeDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
        serviceId: true,
        managerId: true,
        createdAt: true,
      },
    });
  }

  // 2. READ ALL
  async findAll() {
    return this.prisma.employe.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
        service: { select: { id: true, nom_service: true } },
        manager: { select: { id: true, nom: true, prenom: true } },
        createdAt: true,
      },
    });
  }

  // 3. READ ONE
  async findOne(id: number) {
    const employe = await this.prisma.employe.findUnique({
      where: { id },
      include: {
        service: true,
        manager: true,
        subordonnes: true,
      },
    });

    if (!employe) {
      throw new NotFoundException(`Employé avec l'ID ${id} introuvable.`);
    }

    // Retirer le mot de passe de l'objet retourné par sécurité
    const { password, ...result } = employe;
    return result;
  }

  // 4. FIND BY EMAIL (Usage interne pour l'Auth)
  async findByEmail(email: string) {
    return this.prisma.employe.findUnique({
      where: { email },
    });
  }

  // 5. UPDATE
  async update(id: number, updateEmployeDto: UpdateEmployeDto) {
    await this.findOne(id); // Vérifie d'abord si l'employé existe

    // Si le mot de passe est modifié, on le re-hache
    if (updateEmployeDto.password) {
      updateEmployeDto.password = await bcrypt.hash(updateEmployeDto.password, 10);
    }

    return this.prisma.employe.update({
      where: { id },
      data: updateEmployeDto,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  // 6. DELETE
  async remove(id: number) {
    await this.findOne(id); // Vérifie s'il existe

    await this.prisma.employe.delete({
      where: { id },
    });

    return { message: `L'employé avec l'ID ${id} a été supprimé avec succès.` };
  }
}
