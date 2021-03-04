import { AuthorizationService } from './../authorization.service';
import { Action } from './../schemas/permission.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/decorators/actions.decorator';
import { RequestWithUser } from 'src/utils/requests.interface';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const actions: Action[] = this.reflector.get<Action[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );
    if (!actions) return true;
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user: UserDocument = request.user;
    const workspaceId: string = request.params.workspaceId;
    return this.authorizationService.can(user, actions, workspaceId);
  }
}
