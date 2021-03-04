import { User, UserDocument } from './../../users/schemas/user.schema';
import { SchemaFactory, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export enum Role {
  User = 'user',
  Admin = 'admin',
}

export enum PermissionType {
  // Workspace Permissions
  CreateWorkspace = 'workspaces:create',
  ReadWorkspace = 'workspaces:read',
  UpdateWorkspace = 'workspaces:update',
  DeleteWorkspace = 'workspaces:delete',
  // Deployment Permissions
  CreateDeployment = 'deployments:create',
  ReadDeployment = 'deployments:read',
  ProxyDeployment = 'deployments:proxy',
  UpdateDeployment = 'deployments:update',
  DeleteDeployment = 'deployments:delete',
  // Wiki Permissions
  CreateWiki = 'wiki:create',
  ReadWiki = 'wiki:read',
  UpdateWiki = 'wiki:update',
  DeleteWiki = 'wiki:delete',
  // Wiki Section Permissions
  CreateWikiSection = 'wiki_sections:create',
  ReadWikiSection = 'wiki_sections:read',
  UpdateWikiSection = 'wiki_sections:update',
  DeleteWikiSection = 'wiki_sections:delete',
  // Wiki Page Permissions
  CreateWikiPage = 'wiki_pages:create',
  ReadWikiPage = 'wiki_pages:read',
  UpdateWikiPage = 'wiki_pages:update',
  DeleteWikiPage = 'wiki_pages:delete',
  // Project Permissions
  CreateProject = 'projects:create',
  ReadProject = 'projects:read',
  UpdateProject = 'projects:update',
  DeleteProject = 'projects:delete',
  // Project Lane Permissions
  CreateProjectLane = 'project_lanes:create',
  ReadProjectLane = 'project_lanes:read',
  UpdateProjectLane = 'project_lanes:update',
  DeleteProjectLane = 'project_lanes:delete',
  // Project Task Permissions
  CreateProjectTask = 'project_tasks:create',
  ReadProjectTask = 'project_tasks:read',
  UpdateProjectTask = 'project_tasks:update',
  DeleteProjectTask = 'project_tasks:delete',
}

const WorkspacePermissions: string[] = [
  PermissionType.CreateWorkspace,
  PermissionType.ReadWorkspace,
  PermissionType.UpdateWorkspace,
  PermissionType.DeleteWorkspace,
];

const InWorkspacePermissions: string[] = Object.keys(PermissionType)
  .map((v) => PermissionType[v])
  .filter((v) => !WorkspacePermissions.includes(v));

export class WorkspaceRolesAndPermissions {
  @Prop({ required: true, enum: [Role.User, Role.Admin], default: [Role.User] })
  roles: Role[];

  @Prop({
    required: true,
    enum: InWorkspacePermissions,
    default: InWorkspacePermissions,
  })
  permissions: PermissionType[];

  constructor(partial: Partial<WorkspaceRolesAndPermissions>) {
    Object.assign(this, partial);
  }
}

export type PermissionDocument = Permission & mongoose.Document;

export class Permission {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    index: true,
    unique: true,
  })
  user: UserDocument;

  @Prop({ required: true, enum: [Role.User, Role.Admin], default: [Role.User] })
  roles: Role[];

  @Prop({
    required: true,
    enum: WorkspacePermissions,
    default: WorkspacePermissions,
  })
  permissions: PermissionType[];

  @Prop({
    required: true,
    type: { type: Map, of: WorkspaceRolesAndPermissions },
    default: new Map<string, WorkspaceRolesAndPermissions>(),
  })
  workspaces: Map<string, WorkspaceRolesAndPermissions>;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
