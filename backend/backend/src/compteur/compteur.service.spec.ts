import { Test, TestingModule } from '@nestjs/testing';
import { CompteurService } from './compteur.service';

describe('CompteurService', () => {
  let service: CompteurService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompteurService],
    }).compile();

    service = module.get<CompteurService>(CompteurService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
