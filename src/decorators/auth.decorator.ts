import { JwtAuthenticationGuard } from './../modules/authentication/guards/jwt-authentication.guard';
import { Action } from './../modules/authorization/schemas/permission.schema';
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';

export const CONTROLLER_PERMISSIONS_KEY = 'controller_permissions';

export function Auth(...permissions: Action[]) {
  return applyDecorators(
    SetMetadata(CONTROLLER_PERMISSIONS_KEY, permissions),
    UseGuards(JwtAuthenticationGuard),
  );
}
