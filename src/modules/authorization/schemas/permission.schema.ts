import { User, UserDocument } from './../../users/schemas/user.schema';
import { SchemaFactory, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export enum Role {
  User = 'user',
  Admin = 'admin',
}

export enum Action {
  // Workspace Actions
  CreateWorkspace = 'workspaces:create',
  ReadWorkspace = 'workspaces:read',
  UpdateWorkspace = 'workspaces:update',
  DeleteWorkspace = 'workspaces:delete',
  // Deployment Actions
  CreateDeployment = 'deployments:create',
  ReadDeployment = 'deployments:read',
  ProxyDeployment = 'deployments:proxy',
  UpdateDeployment = 'deployments:update',
  DeleteDeployment = 'deployments:delete',
  // Wiki Actions
  CreateWiki = 'wiki:create',
  ReadWiki = 'wiki:read',
  UpdateWiki = 'wiki:update',
  DeleteWiki = 'wiki:delete',
  // Wiki Section Actions
  CreateWikiSection = 'wiki_sections:create',
  ReadWikiSection = 'wiki_sections:read',
  UpdateWikiSection = 'wiki_sections:update',
  DeleteWikiSection = 'wiki_sections:delete',
  // Wiki Page Actions
  CreateWikiPage = 'wiki_pages:create',
  ReadWikiPage = 'wiki_pages:read',
  UpdateWikiPage = 'wiki_pages:update',
  DeleteWikiPage = 'wiki_pages:delete',
  // Project Actions
  CreateProject = 'projects:create',
  ReadProject = 'projects:read',
  UpdateProject = 'projects:update',
  DeleteProject = 'projects:delete',
  // Project Lane Actions
  CreateProjectLane = 'project_lanes:create',
  ReadProjectLane = 'project_lanes:read',
  UpdateProjectLane = 'project_lanes:update',
  DeleteProjectLane = 'project_lanes:delete',
  // Project Task Actions
  CreateProjectTask = 'project_tasks:create',
  ReadProjectTask = 'project_tasks:read',
  UpdateProjectTask = 'project_tasks:update',
  DeleteProjectTask = 'project_tasks:delete',
}

const WorkspaceActions: string[] = [
  Action.CreateWorkspace,
  Action.ReadWorkspace,
  Action.UpdateWorkspace,
  Action.DeleteWorkspace,
];

const InWorkspaceActions: string[] = Object.keys(Action)
  .map((v) => Action[v])
  .filter((v) => !WorkspaceActions.includes(v));

export class WorkspaceRolesAndActions {
  @Prop({ required: true, enum: [Role.User, Role.Admin], default: [Role.User] })
  roles: Role[];

  @Prop({
    required: true,
    enum: InWorkspaceActions,
    default: InWorkspaceActions,
  })
  actions: Action[];

  constructor(partial: Partial<WorkspaceRolesAndActions>) {
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
    enum: WorkspaceActions,
    default: WorkspaceActions,
  })
  actions: Action[];

  @Prop({
    required: true,
    type: { type: Map, of: WorkspaceRolesAndActions },
    default: new Map<string, WorkspaceRolesAndActions>(),
  })
  workspaces: Map<string, WorkspaceRolesAndActions>;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
