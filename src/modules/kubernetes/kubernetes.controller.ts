import { DeploymentDocument } from './../deployments/schemas/deployment.schema';
import { Auth } from '../../decorators/auth.decorator';
import { KubernetesPodsService } from './kubernetes-pods.service';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import {
  ActionDto,
  AuditActionDto,
  AuditResourceDto,
  ExceptionDto,
  MetricsDto,
} from '@agoracloud/common';
import {
  ApiTags,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DeploymentInterceptor } from '../../interceptors/deployment.interceptor';
import { KubernetesService } from './kubernetes.service';
import { WorkspaceInterceptor } from '../../interceptors/workspace.interceptor';
import { Controller, UseInterceptors, Get, Param, Put } from '@nestjs/common';
import { Workspace } from '../../decorators/workspace.decorator';
import { Permissions } from '../../decorators/permissions.decorator';
import { Deployment } from '../../decorators/deployment.decorator';
import { Audit } from '../../decorators/audit.decorator';

@ApiCookieAuth()
@Auth(ActionDto.ReadWorkspace)
@UseInterceptors(WorkspaceInterceptor)
@Controller('api/workspaces/:workspaceId')
export class KubernetesController {
  constructor(
    private readonly kubernetesService: KubernetesService,
    private readonly kubernetesPodsService: KubernetesPodsService,
  ) {}

  /**
   * Get a deployments logs
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Get('deployments/:deploymentId/logs')
  @Permissions(ActionDto.ReadDeployment)
  @UseInterceptors(DeploymentInterceptor)
  @Audit(AuditActionDto.ReadLogs, AuditResourceDto.Deployment)
  @ApiTags('Deployments')
  @ApiOperation({ summary: 'Get a deployments logs' })
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'deploymentId', description: 'The deployment id' })
  @ApiOkResponse({
    description: 'The deployment logs have been successfully retrieved',
    type: 'string',
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or deployment id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Kubernetes pod for the given deployment did not exist',
    type: ExceptionDto,
  })
  findDeploymentLogs(
    @Param('workspaceId') workspaceId: string,
    @Param('deploymentId') deploymentId: string,
  ): Promise<string> {
    return this.kubernetesPodsService.getPodLogs(workspaceId, deploymentId);
  }

  /**
   * Get a deployments metrics (cpu and memory)
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Get('deployments/:deploymentId/metrics')
  @Permissions(ActionDto.ReadDeployment)
  @UseInterceptors(DeploymentInterceptor)
  @Audit(AuditActionDto.ReadMetrics, AuditResourceDto.Deployment)
  @ApiTags('Deployments')
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'deploymentId', description: 'The deployment id' })
  @ApiOperation({ summary: 'Get a deployments metrics (cpu and memory)' })
  @ApiOkResponse({
    description: 'The deployment metrics have been successfully retrieved',
    type: MetricsDto,
  })
  @ApiBadRequestResponse({
    description:
      'Kubernetes pod metrics for the given deployment were not available, the provided workspace id or deployment id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Kubernetes pod for the given deployment did not exist',
    type: ExceptionDto,
  })
  findDeploymentMetrics(
    @Param('workspaceId') workspaceId: string,
    @Deployment() deployment: DeploymentDocument,
  ): Promise<MetricsDto> {
    return this.kubernetesPodsService.getPodMetrics(workspaceId, deployment);
  }

  @Put('deployments/:deploymentId/on')
  @Permissions(ActionDto.UpdateDeployment)
  @UseInterceptors(DeploymentInterceptor)
  @Audit(AuditActionDto.TurnOn, AuditResourceDto.Deployment)
  @ApiTags('Deployments')
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'deploymentId', description: 'The deployment id' })
  @ApiOperation({ summary: 'Turn on a deployment' })
  @ApiOkResponse({
    description: 'The deployment has been successfully turned on',
  })
  @ApiBadRequestResponse({
    description:
      'The deployment did not have an ON_DEMAND scaling method or the deployment is already on',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Kubernetes service for the given deployment did not exist',
    type: ExceptionDto,
  })
  turnOnDeployment(
    @Param('workspaceId') workspaceId: string,
    @Deployment() deployment: DeploymentDocument,
  ): Promise<void> {
    return this.kubernetesService.turnOnDeployment(workspaceId, deployment);
  }

  @Put('deployments/:deploymentId/off')
  @Permissions(ActionDto.UpdateDeployment)
  @UseInterceptors(DeploymentInterceptor)
  @Audit(AuditActionDto.TurnOff, AuditResourceDto.Deployment)
  @ApiTags('Deployments')
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'deploymentId', description: 'The deployment id' })
  @ApiOperation({ summary: 'Turn off a deployment' })
  @ApiOkResponse({
    description: 'The deployment has been successfully turned off',
  })
  @ApiBadRequestResponse({
    description:
      'The deployment did not have an ON_DEMAND scaling method or the deployment is already off',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Kubernetes service for the given deployment did not exist',
    type: ExceptionDto,
  })
  turnOffDeployment(
    @Param('workspaceId') workspaceId: string,
    @Deployment() deployment: DeploymentDocument,
  ): Promise<void> {
    return this.kubernetesService.turnOffDeployment(workspaceId, deployment);
  }

  /**
   * Get a workspaces metrics (cpu, memory and storage)
   * @param workspace the workspace
   */
  @Get('metrics')
  @ApiTags('Workspaces')
  @Audit(AuditActionDto.ReadMetrics, AuditResourceDto.Workspace)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({
    summary: 'Get a workspaces metrics (cpu, memory and storage)',
  })
  @ApiOkResponse({
    description: 'The workspace metrics have been successfully retrieved',
    type: MetricsDto,
  })
  @ApiBadRequestResponse({
    description:
      'Metrics for the given workspace were not available or the provided workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  findWorkspaceMetrics(
    @Workspace() workspace: WorkspaceDocument,
  ): Promise<MetricsDto> {
    return this.kubernetesService.getWorkspaceMetrics(workspace);
  }
}
