import { Auth } from 'src/decorators/auth.decorator';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { ExceptionDto } from './../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { DeploymentInterceptor } from './../../interceptors/deployment.interceptor';
import { All, Controller, Req, Res, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { Deployment } from '../../decorators/deployment.decorator';
import { Action } from '../authorization/schemas/permission.schema';
import { Workspace } from '../../decorators/workspace.decorator';

@ApiCookieAuth()
@ApiTags('Proxy')
@Controller('workspaces/:workspaceId/deployments/:deploymentId/proxy')
@Auth(Action.ReadWorkspace, Action.ReadDeployment, Action.ProxyDeployment)
@UseInterceptors(WorkspaceInterceptor, DeploymentInterceptor)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy a deployment API request
   * @param deployment the deployment
   * @param req the request
   * @param res the response
   */
  @All()
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'deploymentId', description: 'The deployment id' })
  @ApiOperation({ summary: 'Proxy a deployment API request' })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or deployment id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when the api request was being proxied',
    type: ExceptionDto,
  })
  proxy(
    @Workspace('_id') workspaceId: string,
    @Deployment('_id') deploymentId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    this.proxyService.proxy(workspaceId, deploymentId, req, res);
  }
}
