import { ExceptionDto } from './../../utils/base.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { PermissionDto, RolesAndPermissionsDto } from './dto/permission.dto';
import {
  Action,
  PermissionDocument,
  WorkspaceRolesAndPermissions,
} from './schemas/permission.schema';
import { UpdateWorkspaceUserPermissionsDto } from './dto/update-workspace-user-permissions.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { UserInterceptor } from './../../interceptors/user.interceptor';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Auth } from '../../decorators/auth.decorator';
import {
  Controller,
  Put,
  UseInterceptors,
  Param,
  Body,
  Get,
} from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { Workspace } from '../../decorators/workspace.decorator';
import { User } from '../../decorators/user.decorator';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../decorators/permissions.decorator';

@ApiCookieAuth()
@ApiTags('Authorization')
@Auth()
@Controller('api')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  /**
   * Get the logged in users permissions
   * @param userId the users id
   */
  @Get('user/permissions')
  @UseInterceptors(new TransformInterceptor(PermissionDto))
  @ApiOperation({ summary: 'Get the logged in users permissions' })
  @ApiOkResponse({
    description: 'The users permissions have been successfully retrieved',
    type: PermissionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  findCurrent(@User('_id') userId: string): Promise<PermissionDocument> {
    return this.authorizationService.findOne(userId);
  }

  /**
   * Get a users permissions, accessible by super admins only
   * @param userId the users id
   */
  @Permissions(Action.ManageUser)
  @UseInterceptors(UserInterceptor)
  @Get('users/:userId/permissions')
  @UseInterceptors(new TransformInterceptor(PermissionDto))
  @ApiOperation({ summary: 'Get a users permissions' })
  @ApiOkResponse({
    description: 'The users permissions have been successfully retrieved',
    type: PermissionDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided user id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The user with the given id was not found',
    type: ExceptionDto,
  })
  findOne(@Param('userId') userId: string): Promise<PermissionDocument> {
    return this.authorizationService.findOne(userId);
  }

  // TODO: add comments and tags
  @Permissions(Action.ManageUser)
  @UseInterceptors(UserInterceptor)
  @Put('users/:userId/permissions')
  @UseInterceptors(new TransformInterceptor(RolesAndPermissionsDto))
  updateUserPermissions(
    @Param('userId') userId: string,
    @Body() updateUserPermissionsDto: UpdateUserPermissionsDto,
  ): Promise<PermissionDocument> {
    return this.authorizationService.updateUserPermissions(
      userId,
      updateUserPermissionsDto,
    );
  }

  // TODO: add GET workspaces/:workspaceId/users/:userId/permissions

  // TODO: add comments and tags
  @Permissions(Action.ManageWorkspace)
  @UseInterceptors(WorkspaceInterceptor, UserInterceptor)
  @Put('workspaces/:workspaceId/users/:userId/permissions')
  @UseInterceptors(new TransformInterceptor(RolesAndPermissionsDto))
  updateUsersWorkspacePermissions(
    @Workspace('_id') workspaceId: string,
    @Param('userId') userId: string,
    @Body()
    updateWorkspaceUserPermissionsDto: UpdateWorkspaceUserPermissionsDto,
  ): Promise<WorkspaceRolesAndPermissions> {
    return this.authorizationService.updateUsersWorkspacePermissions(
      userId,
      workspaceId,
      updateWorkspaceUserPermissionsDto,
    );
  }
}
