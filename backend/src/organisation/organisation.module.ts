import { Module } from '@nestjs/common';
import { OrganizationController } from './organisation.controller';
import { OrganizationService } from './organisation.service';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService]
})
export class OrganisationModule {}
