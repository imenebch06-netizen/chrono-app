import { Test, TestingModule } from '@nestjs/testing';
import { PointageController } from './pointage.controller';

describe('PointageController', () => {
  let controller: PointageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointageController],
    }).compile();

    controller = module.get<PointageController>(PointageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
