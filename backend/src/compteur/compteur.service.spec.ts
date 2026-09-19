import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CompteurService } from './compteur.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CompteurService', () => {
  let service: CompteurService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      employe: {
        findUnique: jest.fn(),
      },
      compteur: {
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompteurService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CompteurService>(CompteurService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an RTT balance from synthetic pointage data', async () => {
    const generatedData = [
      { employeId: 1, creditDebit: 1.5, soldeRtt: 0.0 },
      { employeId: 1, creditDebit: -2.0, soldeRtt: 1.5 },
      { employeId: 1, creditDebit: 3.0, soldeRtt: -0.5 },
    ];

    prismaMock.employe.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.compteur.upsert.mockResolvedValue({
      employeId: 1,
      credit_debit: 0.0,
      solde_rtt: 0.0,
      solde_conges: 12.0,
    });
    prismaMock.compteur.update.mockResolvedValue({
      employeId: 1,
      credit_debit: 1.5,
      solde_rtt: 1.5,
      solde_conges: 12.0,
    });

    const result = await service.ajusterCreditDebit(1, generatedData[0].creditDebit);

    expect(prismaMock.compteur.update).toHaveBeenCalledWith({
      where: { employeId: 1 },
      data: {
        credit_debit: 1.5,
        solde_rtt: 1.5,
      },
    });
    expect(result.credit_debit).toBe(1.5);
    expect(result.solde_rtt).toBe(1.5);
  });

  it('should subtract synthetic RTT hours and keep the counter updated', async () => {
    const syntheticCounter = {
      employeId: 1,
      credit_debit: 8.0,
      solde_rtt: 8.0,
      solde_conges: 12.0,
    };

    prismaMock.employe.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.compteur.upsert.mockResolvedValue(syntheticCounter);
    prismaMock.compteur.update.mockResolvedValue({
      employeId: 1,
      credit_debit: 4.0,
      solde_rtt: 4.0,
      solde_conges: 12.0,
    });

    const result = await service.deduireRtt(1, 4.0);

    expect(prismaMock.compteur.update).toHaveBeenCalledWith({
      where: { employeId: 1 },
      data: {
        credit_debit: 4.0,
        solde_rtt: 4.0,
      },
    });
    expect(result.credit_debit).toBe(4.0);
    expect(result.solde_rtt).toBe(4.0);
  });

  it('should reject a leave deduction larger than the generated leave balance', async () => {
    prismaMock.employe.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.compteur.upsert.mockResolvedValue({
      employeId: 1,
      credit_debit: 0.0,
      solde_rtt: 0.0,
      solde_conges: 1.0,
    });

    await expect(service.deduireConges(1, 2.0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should decrement the leave balance from generated leave days data', async () => {
    prismaMock.employe.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.compteur.upsert.mockResolvedValue({
      employeId: 1,
      credit_debit: 0.0,
      solde_rtt: 0.0,
      solde_conges: 3.0,
    });
    prismaMock.compteur.update.mockResolvedValue({
      employeId: 1,
      credit_debit: 0.0,
      solde_rtt: 0.0,
      solde_conges: 2.0,
    });

    const result = await service.deduireConges(1, 1.0);

    expect(prismaMock.compteur.update).toHaveBeenCalledWith({
      where: { employeId: 1 },
      data: {
        solde_conges: 2.0,
      },
    });
    expect(result.solde_conges).toBe(2.0);
  });
});
