import { Test, TestingModule } from '@nestjs/testing';
import { CompteurController } from './compteur.controller';

describe('CompteurController', () => {
  let controller: CompteurController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompteurController],
    }).compile();

    controller = module.get<CompteurController>(CompteurController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
