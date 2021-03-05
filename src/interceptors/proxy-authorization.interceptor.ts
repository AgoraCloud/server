import { Action } from './../modules/authorization/schemas/permission.schema';
import { DeploymentDocument } from './../modules/deployments/schemas/deployment.schema';
import { UserDocument } from './../modules/users/schemas/user.schema';
import { AuthorizationService } from './../modules/authorization/authorization.service';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestWithDeploymentAndUser } from 'src/utils/requests.interface';

/**
 * Checks if users have sufficient privileges to proxy deployments
 */
@Injectable()
export class ProxyAuthorizationInterceptor implements NestInterceptor {
  private readonly proxyPermissions: Action[] = [
    Action.ReadWorkspace,
    Action.ReadDeployment,
    Action.ProxyDeployment,
  ];

  constructor(private readonly authorizationService: AuthorizationService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: RequestWithDeploymentAndUser = context
      .switchToHttp()
      .getRequest();
    const user: UserDocument = request.user;
    const deployment: DeploymentDocument = request.deployment;
    const canProxy: boolean = await this.authorizationService.can(
      user,
      this.proxyPermissions,
      deployment.workspace._id,
    );
    if (!canProxy) throw new ForbiddenException();
    return next.handle();
  }
}
