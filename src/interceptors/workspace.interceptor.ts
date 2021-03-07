import { InvalidMongoIdException } from './../exceptions/invalid-mongo-id.exception';
import { RequestWithWorkspaceUserAndIsAdmin } from '../utils/requests.interface';
import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';
import { UserDocument } from '../modules/users/schemas/user.schema';
import { WorkspacesService } from './../modules/workspaces/workspaces.service';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { isMongoId } from 'class-validator';

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  constructor(private readonly workspaceService: WorkspacesService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: RequestWithWorkspaceUserAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const workspaceId: string = request.params.workspaceId;
    if (!isMongoId(workspaceId)) {
      throw new InvalidMongoIdException('workspaceId');
    }

    const user: UserDocument = request.user;
    const isAdmin: boolean = request.isAdmin;
    const workspace: WorkspaceDocument = await this.workspaceService.findOne(
      workspaceId,
      isAdmin ? undefined : user._id,
    );
    request.workspace = workspace;
    return next.handle();
  }
}
