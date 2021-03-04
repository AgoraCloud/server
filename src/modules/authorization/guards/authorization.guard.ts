import { CONTROLLER_PERMISSIONS_KEY } from './../../../decorators/auth.decorator';
import { AuthorizationService } from './../authorization.service';
import { Action } from './../schemas/permission.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../../decorators/permissions.decorator';
import { RequestWithUser } from '../../../utils/requests.interface';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const controllerPermissions: Action[] =
      this.reflector.get<Action[]>(
        CONTROLLER_PERMISSIONS_KEY,
        context.getHandler(),
      ) || [];
    const methodPermissions: Action[] =
      this.reflector.get<Action[]>(PERMISSIONS_KEY, context.getHandler()) || [];
    const permissions: Action[] = [
      ...controllerPermissions,
      ...methodPermissions,
    ];
    if (!permissions.length) return true;
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user: UserDocument = request.user;
    const workspaceId: string = request.params.workspaceId;
    return this.authorizationService.can(user, permissions, workspaceId);
  }
}
