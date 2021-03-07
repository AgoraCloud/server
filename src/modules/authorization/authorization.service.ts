import { UpdateWorkspaceUserPermissionsDto } from './dto/update-workspace-user-permissions.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { WorkspaceNotFoundException } from './../../exceptions/workspace-not-found.exception';
import { UserDocument } from './../users/schemas/user.schema';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceCreatedEvent } from './../../events/workspace-created.event';
import { UserDeletedEvent } from './../../events/user-deleted.event';
import { UserCreatedEvent } from './../../events/user-created.event';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Action,
  Permission,
  PermissionDocument,
  Role,
  WorkspaceRolesAndPermissions,
} from './schemas/permission.schema';
import { Model } from 'mongoose';
import { Event } from '../../events/events.enum';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  /**
   * Create a users permissions
   * @param permission the users permissions to create
   */
  private async create(permission: Permission): Promise<PermissionDocument> {
    const createdPermission: PermissionDocument = await this.permissionModel.create(
      permission,
    );
    return createdPermission;
  }

  /**
   * Find all permissions for users that are members in the given workspace
   * @param workspaceId the workspace id
   */
  private async findAll(workspaceId: string): Promise<PermissionDocument[]> {
    const retrievedPermissions: PermissionDocument[] = await this.permissionModel
      .find()
      .exec();
    return retrievedPermissions.filter((p) => p.workspaces.has(workspaceId));
  }

  /**
   * Find a users permissions
   * @param userId the users id
   */
  async findOne(userId: string): Promise<PermissionDocument> {
    const permission: PermissionDocument = await this.permissionModel
      .findOne()
      .where('user')
      .equals(userId)
      .exec();
    if (!permission) throw new InternalServerErrorException();
    return permission;
  }

  /**
   * Update a users permissions
   * @param permission the updated users permissions
   */
  private async update(
    permission: PermissionDocument,
  ): Promise<PermissionDocument> {
    const updatedPermission: PermissionDocument = await this.permissionModel
      .findOneAndUpdate(null, permission, { new: true })
      .where('_id')
      .equals(permission._id)
      .exec();
    return updatedPermission;
  }

  // TODO: add comments
  // TODO: finish this
  async updateUserPermissions(
    userId: string,
    updateUserPermissionsDto: UpdateUserPermissionsDto,
  ): Promise<PermissionDocument> {
    return;
  }

  // TODO: add comments
  // TODO: finish this
  async updateWorkspaceUserPermissions(
    workspaceId: string,
    userId: string,
    updateWorkspaceUserPermissionsDto: UpdateWorkspaceUserPermissionsDto,
  ): Promise<WorkspaceRolesAndPermissions> {
    // TODO: get the users permissions, check if they have the workspace, if they dont throw an exception
    return;
  }

  /**
   * Delete a users permissions
   * @param userId the users id
   */
  private async remove(userId: string): Promise<void> {
    await this.permissionModel.deleteOne().where('user').equals(userId).exec();
  }

  /**
   * Handles the user.created event
   * @param payload the user.created event payload
   */
  @OnEvent(Event.UserCreated)
  private async handleUserCreatedEvent(
    payload: UserCreatedEvent,
  ): Promise<void> {
    const userRole: Role = payload.role;
    const permission: Permission = new Permission({
      user: payload.user,
      roles: [userRole],
    });
    if (userRole === Role.SuperAdmin) {
      permission.permissions = [];
    }
    await this.create(permission);
  }

  /**
   * Handles the user.deleted event
   * @param payload the user.deleted event payload
   */
  @OnEvent(Event.UserDeleted)
  private async handleUserDeletedEvent(
    payload: UserDeletedEvent,
  ): Promise<void> {
    await this.remove(payload.id);
  }

  /**
   * Handles the workspace.created event
   * @param payload the workspace.created event payload
   */
  @OnEvent(Event.WorkspaceCreated)
  private async handleWorkspaceCreatedEvent(
    payload: WorkspaceCreatedEvent,
  ): Promise<void> {
    const workspace: WorkspaceDocument = payload.workspace;
    // A workspace will only have one user (workspace admin) when created
    const user: UserDocument = workspace.users[0];
    const permission: PermissionDocument = await this.findOne(user._id);
    permission.workspaces.set(
      workspace._id,
      new WorkspaceRolesAndPermissions({
        roles: [Role.WorkspaceAdmin],
        permissions: [],
      }),
    );
    await this.update(permission);
  }

  /**
   * Handles the workspace.user.removed event
   * @param payload the workspace.user.removed event payload
   */
  @OnEvent(Event.WorkspaceUserRemoved)
  private async handleWorkspaceUserRemovedEvent(
    payload: WorkspaceUserRemovedEvent,
  ): Promise<void> {
    const permission: PermissionDocument = await this.findOne(payload.userId);
    permission.workspaces.delete(payload.workspaceId);
    await this.update(permission);
  }

  /**
   * Handles the workspace.deleted event
   * @param payload the workspace.deleted event payload
   */
  @OnEvent(Event.WorkspaceDeleted)
  private async handleWorkspaceDeletedEvent(
    payload: WorkspaceDeletedEvent,
  ): Promise<void> {
    const workspaceId: string = payload.id;
    const permissions: PermissionDocument[] = await this.findAll(workspaceId);
    for (const permission of permissions) {
      permission.workspaces.delete(workspaceId);
      await this.update(permission);
    }
  }

  /**
   * Checks whether a user has the given permissions
   * @param user the user
   * @param neededPermissions the needed permissions
   * @param workspaceId the workspace id
   */
  async can(
    user: UserDocument,
    neededPermissions: Action[],
    workspaceId?: string,
  ): Promise<{ canActivate: boolean; isAdmin: boolean }> {
    const permission: PermissionDocument = await this.findOne(user._id);
    const grantedPermissions: Action[] = permission.permissions;

    /**
     * Checks whether the users granted permissions contain the needed permissions
     * @param grantedPermissions the users granted permissions
     * @param neededPermissions the users needed permissions
     */
    const hasPermissions = (
      grantedPermissions: Action[],
      neededPermissions: Action[],
    ): boolean => {
      if (!grantedPermissions.length || !neededPermissions.length) return false;
      let hasPermissions = true;
      for (const action of neededPermissions) {
        hasPermissions = hasPermissions && grantedPermissions.includes(action);
        if (!hasPermissions) break;
      }
      return hasPermissions;
    };

    if (permission.roles.includes(Role.SuperAdmin)) {
      return { canActivate: true, isAdmin: true };
    } else if (!workspaceId) {
      return {
        canActivate: hasPermissions(grantedPermissions, neededPermissions),
        isAdmin: false,
      };
    }

    const workspaceRolesAndPermissions: WorkspaceRolesAndPermissions = permission.workspaces.get(
      workspaceId,
    );
    if (!workspaceRolesAndPermissions) {
      throw new WorkspaceNotFoundException(workspaceId);
    }
    if (workspaceRolesAndPermissions.roles.includes(Role.WorkspaceAdmin)) {
      return { canActivate: true, isAdmin: true };
    } else {
      return {
        canActivate: hasPermissions(
          [...grantedPermissions, ...workspaceRolesAndPermissions.permissions],
          neededPermissions,
        ),
        isAdmin: false,
      };
    }
  }
}
