import { Test, TestingModule } from '@nestjs/testing';
import { PointageService } from './pointage.service';

describe('PointageService', () => {
  let service: PointageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointageService],
    }).compile();

    service = module.get<PointageService>(PointageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
