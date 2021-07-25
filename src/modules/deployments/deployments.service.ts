import { DeploymentVersionCanNotBeUpgradedException } from './../../exceptions/deployment-version-can-not-be-upgraded.exception';
import { InvalidDeploymentVersionUpgradeException } from './../../exceptions/invalid-deployment-version-upgrade.exception';
import { DeploymentTypeMismatchException } from './../../exceptions/deployment-type-mismatch.exception';
import { DeploymentCannotBeUpdatedException } from '../../exceptions/deployment-cannot-be-updated.exception';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { DeploymentDeletedEvent } from './../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from './../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from './../../events/deployment-created.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Deployment } from './schemas/deployment.schema';
import { DeploymentNotFoundException } from './../../exceptions/deployment-not-found.exception';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { DeploymentDocument } from './schemas/deployment.schema';
import { Model, Query } from 'mongoose';
import { Injectable } from '@nestjs/common';
import {
  CreateDeploymentDto,
  DeploymentStatusDto,
  UpdateDeploymentDto,
  UpdateDeploymentResourcesDto,
  DEPLOYMENT_IMAGES_DTO,
  DeploymentImageDto,
  UpdateDeploymentImageDto,
  DeploymentTypeDto,
} from '@agoracloud/common';
import { Event } from '../../events/events.enum';
import { isDefined } from 'class-validator';

@Injectable()
export class DeploymentsService {
  constructor(
    @InjectModel(Deployment.name)
    private readonly deploymentModel: Model<DeploymentDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a deployment
   * @param user the user
   * @param workspace the workspace
   * @param createDeploymentDto the deployment to create
   * @returns the created deployment document
   */
  async create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    createDeploymentDto: CreateDeploymentDto,
  ): Promise<DeploymentDocument> {
    const sudoPassword: string = createDeploymentDto.properties.sudoPassword;
    // Remove the sudoPassword field
    delete createDeploymentDto.properties.sudoPassword;
    const deployment: Deployment = new Deployment(createDeploymentDto);
    deployment.user = user;
    deployment.workspace = workspace;

    const createdDeployment: DeploymentDocument =
      await this.deploymentModel.create(deployment);
    this.eventEmitter.emit(
      Event.DeploymentCreated,
      new DeploymentCreatedEvent(sudoPassword, createdDeployment),
    );
    return createdDeployment;
  }

  /**
   * Find all deployment images
   * @returns all deployment images
   */
  findAllImages(): DeploymentImageDto[] {
    return DEPLOYMENT_IMAGES_DTO;
  }

  /**
   * Find all deployments
   * @param workspaceId the workspace id
   * @param userId the users id
   * @returns an array of deployment documents
   */
  async findAll(
    workspaceId: string,
    userId?: string,
  ): Promise<DeploymentDocument[]> {
    let deploymentsQuery: Query<DeploymentDocument[], DeploymentDocument> =
      this.deploymentModel.find().where('workspace').equals(workspaceId);
    if (userId) {
      deploymentsQuery = deploymentsQuery.where('user').equals(userId);
    }
    const deployments: DeploymentDocument[] = await deploymentsQuery.exec();
    return deployments;
  }

  /**
   * Find a deployment
   * @param deploymentId the deployment id
   * @param userId the users id
   * @param workspaceId the workspace id
   * @throws DeploymentNotFoundException
   * @returns a deployment document
   */
  async findOne(
    deploymentId: string,
    userId?: string,
    workspaceId?: string,
  ): Promise<DeploymentDocument> {
    let deploymentQuery: Query<DeploymentDocument, DeploymentDocument> =
      this.deploymentModel.findOne().where('_id').equals(deploymentId);
    if (userId) {
      deploymentQuery = deploymentQuery.where('user').equals(userId);
    }
    if (workspaceId) {
      deploymentQuery = deploymentQuery.where('workspace').equals(workspaceId);
    }
    const deployment: DeploymentDocument = await deploymentQuery.exec();
    if (!deployment) throw new DeploymentNotFoundException(deploymentId);
    return deployment;
  }

  /**
   * Update a deployment
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   * @param updateDeploymentDto the updated deployment
   * @param userId the users id
   * @throws DeploymentCannotBeUpdatedException
   * @returns the updated deployment document
   */
  async update(
    workspaceId: string,
    deploymentId: string,
    updateDeploymentDto: UpdateDeploymentDto,
    userId?: string,
  ): Promise<DeploymentDocument> {
    const deployment: DeploymentDocument = await this.findOne(
      deploymentId,
      userId,
      workspaceId,
    );
    const allowedStatuses: DeploymentStatusDto[] = [
      DeploymentStatusDto.Running,
      DeploymentStatusDto.Failed,
    ];
    if (!allowedStatuses.includes(deployment.status)) {
      throw new DeploymentCannotBeUpdatedException(deploymentId);
    }

    const updateDeploymentResourcesDto: UpdateDeploymentResourcesDto =
      updateDeploymentDto.properties?.resources;
    // Tracks whether a deployments Kubernetes specific attributes were updated
    let isDeploymentUpdated = false;

    // Change the updated fields only
    deployment.name = updateDeploymentDto.name || deployment.name;
    const newCpuCount: number = updateDeploymentResourcesDto?.cpuCount;
    if (
      isDefined(newCpuCount) &&
      deployment.properties.resources.cpuCount !== newCpuCount
    ) {
      deployment.properties.resources.cpuCount = newCpuCount;
      isDeploymentUpdated = true;
    }
    const newMemoryCount: number = updateDeploymentResourcesDto?.memoryCount;
    if (
      isDefined(newMemoryCount) &&
      deployment.properties.resources.memoryCount !== newMemoryCount
    ) {
      deployment.properties.resources.memoryCount = newMemoryCount;
      isDeploymentUpdated = true;
    }

    // Check if a new deployment image version has been supplied
    const updateDeploymentImageDto: UpdateDeploymentImageDto =
      updateDeploymentDto.properties?.image;
    if (updateDeploymentImageDto) {
      if (updateDeploymentImageDto.type !== deployment.properties.image.type) {
        throw new DeploymentTypeMismatchException(
          deploymentId,
          deployment.properties.image.type,
          updateDeploymentImageDto.type,
        );
      }
      const newImageIndex: number = DEPLOYMENT_IMAGES_DTO.findIndex(
        (i: DeploymentImageDto) =>
          i.type === updateDeploymentImageDto.type &&
          i.version === updateDeploymentImageDto.version,
      );
      const currentImageIndex: number = DEPLOYMENT_IMAGES_DTO.findIndex(
        (i: DeploymentImageDto) =>
          i.type === deployment.properties.image.type &&
          i.version === deployment.properties.image.version,
      );
      // Versions of deployments with type UBUNTU can not be upgraded
      if (
        updateDeploymentImageDto.type === DeploymentTypeDto.Ubuntu &&
        newImageIndex !== currentImageIndex
      ) {
        throw new DeploymentVersionCanNotBeUpgradedException(
          deploymentId,
          updateDeploymentImageDto.type,
        );
      }
      if (newImageIndex >= currentImageIndex) {
        throw new InvalidDeploymentVersionUpgradeException(
          deploymentId,
          deployment.properties.image.version,
          updateDeploymentImageDto.version,
        );
      }
      deployment.properties.image.version = updateDeploymentImageDto.version;
      isDeploymentUpdated = true;
    }

    let deploymentQuery: Query<
      { ok: number; n: number; nModified: number },
      DeploymentDocument
    > = this.deploymentModel
      .updateOne(null, deployment)
      .where('_id')
      .equals(deploymentId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      deploymentQuery = deploymentQuery.where('user').equals(userId);
    }
    await deploymentQuery.exec();

    /**
     * Send the deployment.updated event only if cpuCount, memoryCount and/or
     * image version have been updated
     */
    if (isDeploymentUpdated) {
      this.eventEmitter.emit(
        Event.DeploymentUpdated,
        new DeploymentUpdatedEvent(
          workspaceId,
          deploymentId,
          updateDeploymentDto,
        ),
      );
    }
    return deployment;
  }

  /**
   * Update a deployments status and failure reason
   * @param deploymentId the deployment id
   * @param status the deployment status
   * @param failureReason failure reason if a deployments status is FAILED
   * @throws DeploymentNotFoundException
   */
  async updateStatus(
    deploymentId: string,
    status: DeploymentStatusDto,
    failureReason?: string,
  ): Promise<void> {
    await this.deploymentModel
      .updateOne({ _id: deploymentId }, { status, failureReason })
      .exec();
  }

  /**
   * Delete a deployment
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   * @param userId the users id
   */
  async remove(
    workspaceId: string,
    deploymentId: string,
    userId?: string,
  ): Promise<void> {
    let deploymentQuery: Query<DeploymentDocument, DeploymentDocument> =
      this.deploymentModel
        .findOneAndDelete()
        .where('_id')
        .equals(deploymentId)
        .where('workspace')
        .equals(workspaceId);
    if (userId) {
      deploymentQuery = deploymentQuery.where('user').equals(userId);
    }
    const deployment: DeploymentDocument = await deploymentQuery.exec();
    if (!deployment) throw new DeploymentNotFoundException(deploymentId);
    this.eventEmitter.emit(
      Event.DeploymentDeleted,
      new DeploymentDeletedEvent(deployment),
    );
  }

  /**
   * Delete all deployments for the given workspace
   * @param workspaceId the workspace id
   * @param userId the users id
   * @param emitEvents controls whether the deployment.deleted event should be fired
   */
  private async removeAll(
    workspaceId: string,
    userId?: string,
    emitEvents = false,
  ): Promise<void> {
    const deployments: DeploymentDocument[] = await this.findAll(
      workspaceId,
      userId,
    );
    const deploymentIds: string[] = deployments.map((d) => d._id);
    await this.deploymentModel
      .deleteMany()
      .where('_id')
      .in(deploymentIds)
      .exec();
    if (emitEvents) {
      deployments.forEach((deployment: DeploymentDocument) => {
        this.eventEmitter.emit(
          Event.DeploymentDeleted,
          new DeploymentDeletedEvent(deployment),
        );
      });
    }
  }

  /**
   * Handles the workspace.deleted event
   * @param payload the workspace.deleted event payload
   */
  @OnEvent(Event.WorkspaceDeleted)
  private async handleWorkspaceDeletedEvent(
    payload: WorkspaceDeletedEvent,
  ): Promise<void> {
    await this.removeAll(payload.id);
  }

  /**
   * Handles the workspace.user.removed event
   * @param payload the workspace.user.removed event payload
   */
  @OnEvent(Event.WorkspaceUserRemoved)
  private async handleWorkspaceUserRemovedEvent(
    payload: WorkspaceUserRemovedEvent,
  ): Promise<void> {
    await this.removeAll(payload.workspaceId, payload.userId, true);
  }
}
