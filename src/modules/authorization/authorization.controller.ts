import { ExceptionDto } from './../../utils/base.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { PermissionDto, RolesAndPermissionsDto } from './dto/permission.dto';
import { JwtAuthenticationGuard } from './../authentication/guards/jwt-authentication.guard';
import {
  PermissionDocument,
  WorkspaceRolesAndPermissions,
} from './schemas/permission.schema';
import { UpdateWorkspaceUserPermissionsDto } from './dto/update-workspace-user-permissions.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { FindOneParams } from './../../utils/find-one-params';
import { UserInterceptor } from './../../interceptors/user.interceptor';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Auth } from 'src/decorators/auth.decorator';
import {
  Controller,
  Put,
  UseInterceptors,
  Param,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { Workspace } from 'src/decorators/workspace.decorator';
import { User } from 'src/decorators/user.decorator';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiCookieAuth()
@ApiTags('Authorization')
@Controller('api')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  /**
   * Get a users permissions
   * @param userId the users id
   */
  @Get('user/permissions')
  @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(new TransformInterceptor(PermissionDto))
  @ApiOperation({ summary: 'Get a users permissions' })
  @ApiOkResponse({
    description: 'The users permissions have been successfully retrieved',
    type: PermissionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  findOne(@User('_id') userId: string): Promise<PermissionDocument> {
    return this.authorizationService.findOne(userId);
  }

  // TODO: add comments and tags
  @Auth()
  @UseInterceptors(UserInterceptor)
  @Put('users/:userId/permissions')
  @UseInterceptors(new TransformInterceptor(RolesAndPermissionsDto))
  updateUserPermissions(
    @Param() { id: userId }: FindOneParams,
    @Body() updateUserPermissionsDto: UpdateUserPermissionsDto,
  ): Promise<PermissionDocument> {
    return this.authorizationService.updateUserPermissions(
      userId,
      updateUserPermissionsDto,
    );
  }

  // TODO: add comments and tags
  @Auth()
  @UseInterceptors(WorkspaceInterceptor, UserInterceptor)
  @Put('workspaces/:workspaceId/users/:userId/permissions')
  @UseInterceptors(new TransformInterceptor(RolesAndPermissionsDto))
  updateWorkspaceUserPermissions(
    @Workspace('_id') workspaceId: string,
    @Param() { id: userId }: FindOneParams,
    @Body()
    updateWorkspaceUserPermissionsDto: UpdateWorkspaceUserPermissionsDto,
  ): Promise<WorkspaceRolesAndPermissions> {
    return this.authorizationService.updateWorkspaceUserPermissions(
      workspaceId,
      userId,
      updateWorkspaceUserPermissionsDto,
    );
  }
}
