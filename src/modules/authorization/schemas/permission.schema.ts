import { User, UserDocument } from './../../users/schemas/user.schema';
import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import {
  RoleDto,
  ActionDto,
  IN_WORKSPACE_ACTIONS_DTO,
  WORKSPACE_ACTIONS_DTO,
} from '@agoracloud/common';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * List of actions (permissions) needed to proxy a deployment
 */
export const PROXY_ACTIONS_DTO: ActionDto[] = [
  ActionDto.ReadWorkspace,
  ActionDto.ReadDeployment,
  ActionDto.ProxyDeployment,
];

export class WorkspaceRolesAndPermissions {
  @Prop({
    required: true,
    type: [String],
    enum: [RoleDto.User, RoleDto.WorkspaceAdmin],
    default: [RoleDto.User],
  })
  roles: RoleDto[];

  @Prop({
    required: true,
    type: [String],
    enum: IN_WORKSPACE_ACTIONS_DTO,
    default: IN_WORKSPACE_ACTIONS_DTO,
  })
  permissions: ActionDto[];

  constructor(partial: Partial<WorkspaceRolesAndPermissions>) {
    Object.assign(this, partial);
  }
}

export type PermissionDocument = Permission & Document;

@Schema({ collection: 'permissions' })
export class Permission {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    index: true,
    unique: true,
  })
  user: UserDocument;

  @Prop({
    required: true,
    type: [String],
    enum: [RoleDto.User, RoleDto.SuperAdmin],
    default: [RoleDto.User],
  })
  roles: RoleDto[];

  @Prop({
    required: true,
    type: [String],
    enum: WORKSPACE_ACTIONS_DTO,
    default: WORKSPACE_ACTIONS_DTO,
  })
  permissions: ActionDto[];

  @Prop({
    required: true,
    type: Map,
    default: new Map<string, WorkspaceRolesAndPermissions>(),
  })
  workspaces: Map<string, WorkspaceRolesAndPermissions>;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
