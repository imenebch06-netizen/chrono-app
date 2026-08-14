// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role,ExtendedRole } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ExtendedRole[]) => SetMetadata(ROLES_KEY, roles);
