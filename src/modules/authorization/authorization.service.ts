import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceCreatedEvent } from './../../events/workspace-created.event';
import { UserDeletedEvent } from './../../events/user-deleted.event';
import { UserCreatedEvent } from './../../events/user-created.event';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { UpdateAuthorizationDto } from './dto/update-authorization.dto';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { Model } from 'mongoose';
import { Event } from '../../events/events.enum';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  private async create(userId: string): Promise<PermissionDocument> {
    return;
  }

  findOne(userId: string): Promise<PermissionDocument> {
    return;
  }

  update(
    userId: string,
    updateAuthorizationDto: UpdateAuthorizationDto,
  ): Promise<PermissionDocument> {
    return;
  }

  remove(userId: string): Promise<void> {
    return;
  }

  // TODO: create permissions for user
  @OnEvent(Event.UserCreated)
  private async handleUserCreatedEvent(
    payload: UserCreatedEvent,
  ): Promise<void> {}

  // TODO: delete permissions for user
  @OnEvent(Event.UserDeleted)
  private async handleUserDeletedEvent(
    payload: UserDeletedEvent,
  ): Promise<void> {}

  // TODO: add the workspace to the users permissions
  @OnEvent(Event.WorkspaceCreated)
  private async handleWorkspaceCreatedEvent(
    payload: WorkspaceCreatedEvent,
  ): Promise<void> {}

  // TODO: delete the workspace from the users permissions
  @OnEvent(Event.WorkspaceUserRemoved)
  private async handleWorkspaceUserRemovedEvent(
    payload: WorkspaceUserRemovedEvent,
  ): Promise<void> {}

  // TODO: delete the workspace from all users permissions
  @OnEvent(Event.WorkspaceDeleted)
  private async handleWorkspaceDeletedEvent(
    payload: WorkspaceDeletedEvent,
  ): Promise<void> {}
}
