import { Test, TestingModule } from '@nestjs/testing';
import { DemandeAbsenceController } from './demande-absence.controller';

describe('DemandeAbsenceController', () => {
  let controller: DemandeAbsenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemandeAbsenceController],
    }).compile();

    controller = module.get<DemandeAbsenceController>(DemandeAbsenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
