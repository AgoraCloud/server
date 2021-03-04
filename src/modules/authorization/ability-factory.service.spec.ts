import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from './ability-factory.service';

describe('AbilityfactoryService', () => {
  let service: AbilityFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityFactory],
    }).compile();

    service = module.get<AbilityFactory>(AbilityFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
