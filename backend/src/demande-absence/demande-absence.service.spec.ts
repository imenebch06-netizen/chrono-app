import { Test, TestingModule } from '@nestjs/testing';
import { DemandeAbsenceService } from './demande-absence.service';

describe('DemandeAbsenceService', () => {
  let service: DemandeAbsenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemandeAbsenceService],
    }).compile();

    service = module.get<DemandeAbsenceService>(DemandeAbsenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
