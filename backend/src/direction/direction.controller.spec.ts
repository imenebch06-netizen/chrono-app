import { Test, TestingModule } from '@nestjs/testing';
import { DirectionController } from './direction.controller';

describe('DirectionController', () => {
  let controller: DirectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectionController],
    }).compile();

    controller = module.get<DirectionController>(DirectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
