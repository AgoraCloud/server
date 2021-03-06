import {
  WorkspaceDto,
  ExceptionDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddWorkspaceUserDto,
  ActionDto,
  AuditActionDto,
  AuditResourceDto,
} from '@agoracloud/common';
import { UserInterceptor } from './../../interceptors/user.interceptor';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Auth } from '../../decorators/auth.decorator';
import { Permissions } from './../../decorators/permissions.decorator';
import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiOperation,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { WorkspaceDocument } from './schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { FindOneParams } from './../../utils/find-one-params';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { User } from '../../decorators/user.decorator';
import { IsAdmin } from '../../decorators/is-admin.decorator';
import { Workspace } from '../../decorators/workspace.decorator';
import { Audit } from '../../decorators/audit.decorator';
import { Transform } from '../../decorators/transform.decorator';

@ApiCookieAuth()
@ApiTags('Workspaces')
@Controller('api/workspaces')
@Auth()
@Transform(WorkspaceDto)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * Create a workspace
   * @param user the user
   * @param createWorkspaceDto the workspace to create
   */
  @Post()
  @Permissions(ActionDto.CreateWorkspace)
  @Audit(AuditActionDto.Create, AuditResourceDto.Workspace)
  @ApiOperation({ summary: 'Create a workspace' })
  @ApiCreatedResponse({
    description: 'The workspace has been successfully created',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  create(
    @User() user: UserDocument,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.create(user, createWorkspaceDto);
  }

  /**
   * Get all workspaces
   * @param userId the users id
   */
  @Get()
  @Permissions(ActionDto.ReadWorkspace)
  @Audit(AuditActionDto.Read, AuditResourceDto.Workspace)
  @ApiOperation({ summary: 'Get all workspaces' })
  @ApiOkResponse({
    description: 'The workspaces have been successfully retrieved',
    type: [WorkspaceDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  findAll(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
  ): Promise<WorkspaceDocument[]> {
    if (isAdmin) {
      return this.workspacesService.findAll();
    }
    return this.workspacesService.findAll(userId);
  }

  /**
   * Get a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Get(':id')
  @Permissions(ActionDto.ReadWorkspace)
  @Audit(AuditActionDto.Read, AuditResourceDto.Workspace)
  @ApiParam({ name: 'id', description: 'The workspace id' })
  @ApiOperation({ summary: 'Get a workspace' })
  @ApiOkResponse({
    description: 'The workspace has been successfully retrieved',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Param() { id: workspaceId }: FindOneParams,
  ): Promise<WorkspaceDocument> {
    if (isAdmin) {
      return this.workspacesService.findOne(workspaceId);
    }
    return this.workspacesService.findOne(workspaceId, userId);
  }

  /**
   * Update a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param updateWorkspaceDto the updated workspace
   */
  @Put(':id')
  @Permissions(ActionDto.UpdateWorkspace)
  @Audit(AuditActionDto.Update, AuditResourceDto.Workspace)
  @ApiParam({ name: 'id', description: 'The workspace id' })
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiOkResponse({
    description: 'The workspace has been successfully updated',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace or workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Param() { id: workspaceId }: FindOneParams,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    if (isAdmin) {
      return this.workspacesService.update(workspaceId, updateWorkspaceDto);
    }
    return this.workspacesService.update(
      workspaceId,
      updateWorkspaceDto,
      userId,
    );
  }

  /**
   * Delete a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Delete(':id')
  @Permissions(ActionDto.DeleteWorkspace)
  @Audit(AuditActionDto.Delete, AuditResourceDto.Workspace)
  @ApiParam({ name: 'id', description: 'The workspace id' })
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiOkResponse({
    description: 'The workspace has been successfully deleted',
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Param() { id: workspaceId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.workspacesService.remove(workspaceId);
    }
    return this.workspacesService.remove(workspaceId, userId);
  }

  /**
   * Get the users in a workspace
   * @param workspaceId the workspace id
   */
  @Get(':workspaceId/users')
  @Permissions(ActionDto.ReadWorkspace)
  @UseInterceptors(WorkspaceInterceptor)
  @Audit(AuditActionDto.ReadUsers, AuditResourceDto.Workspace)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Get the users in a workspace' })
  @ApiOkResponse({
    description: 'The users in the workspace have been successfully retrieved',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  getUsers(@Workspace('_id') workspaceId: string): Promise<WorkspaceDocument> {
    return this.workspacesService.findOneUsers(workspaceId);
  }

  /**
   * Add a user to a workspace, accessible by super admins and workspace admins
   * @param workspace the workspace
   * @param addWorkspaceUserDto the user to add
   */
  @Put(':workspaceId/users')
  @Permissions(ActionDto.ManageWorkspace)
  @UseInterceptors(WorkspaceInterceptor)
  @Audit(AuditActionDto.AddUser, AuditResourceDto.Workspace)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Add a user to a workspace' })
  @ApiOkResponse({
    description: 'The user has been successfully added to the workspace',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace or user id was not valid or the provided user was already a member of the provided workspace',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or user with the given id was not found',
    type: ExceptionDto,
  })
  addUser(
    @Workspace() workspace: WorkspaceDocument,
    @Body() addWorkspaceUserDto: AddWorkspaceUserDto,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.addUser(workspace, addWorkspaceUserDto);
  }

  /**
   * Remove a user from a workspace, accessible by super admins and workspace admins
   * @param workspace the workspace
   * @param userId the users id
   */
  @Delete(':workspaceId/users/:userId')
  @Permissions(ActionDto.ManageWorkspace)
  @UseInterceptors(WorkspaceInterceptor, UserInterceptor)
  @Audit(AuditActionDto.RemoveUser, AuditResourceDto.Workspace)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Remove a user from a workspace' })
  @ApiOkResponse({
    description: 'The user has been successfully removed from the workspace',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace or user id was not valid, the provided user was not a member of the provided workspace or the workspace will have no members left if the user was removed',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or user with the given id was not found',
    type: ExceptionDto,
  })
  removeUser(
    @Workspace() workspace: WorkspaceDocument,
    @Param('userId') userId: string,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.removeUser(workspace, userId);
  }
}
