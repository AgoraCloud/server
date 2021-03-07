import { UserNotInWorkspaceException } from './../../exceptions/user-not-in-workspace.exception';
import { UserDocument } from './../users/schemas/user.schema';
import {
  Permission,
  PermissionSchema,
  PermissionDocument,
  Action,
  Role,
} from './schemas/permission.schema';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { Connection, Types, Model } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { InternalServerErrorException } from '@nestjs/common';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
} as UserDocument;
const workspaceId: string = Types.ObjectId().toHexString();

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let connection: Connection;
  let permissionsModel: Model<PermissionDocument>;
  let permissions: PermissionDocument;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: Permission.name, schema: PermissionSchema },
        ]),
      ],
      providers: [AuthorizationService],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
    connection = await module.get(getConnectionToken());
    permissionsModel = module.get<Model<PermissionDocument>>(
      getModelToken(Permission.name),
    );

    // Create a permissions entry for the user
    const permission: Permission = new Permission({
      user,
      roles: [Role.SuperAdmin],
      permissions: [],
      workspaces: new Map(),
    });
    permission.workspaces.set(workspaceId, {
      roles: [Role.WorkspaceAdmin],
      permissions: [],
    });
    permissions = await permissionsModel.create(permission);
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw an error if the permissions for the given user were not found', async () => {
      const userId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new InternalServerErrorException()
        .message;
      try {
        await service.findOne(userId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the permissions for the given user', async () => {
      const permissions: PermissionDocument = await service.findOne(user._id);
      expect(permissions).toBeTruthy();
      expect(permissions.user._id).toEqual(user._id);
    });
  });

  describe('updateUserPermissions', () => {
    it('', async () => {});
  });

  describe('updateUsersWorkspacePermissions', () => {
    it('', async () => {});
  });

  describe('can', () => {
    it('should grant a super admin any permissions needed', async () => {
      const { canActivate, isAdmin } = await service.can(user, [
        Action.CreateWorkspace,
        Action.ReadWorkspace,
        Action.ProxyDeployment,
        Action.CreateDeployment,
      ]);
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(true);
    });

    it('should not grant a user application-wide permissions they do not have', async () => {
      // Demote the user to the 'user' role application-wide
      permissions = await permissionsModel
        .findOneAndUpdate(
          { _id: permissions._id },
          { roles: [Role.User], permissions: [Action.ReadWorkspace] },
          { new: true },
        )
        .exec();
      const { canActivate, isAdmin } = await service.can(user, [
        Action.CreateWorkspace,
      ]);
      expect(canActivate).toBe(false);
      expect(isAdmin).toBe(false);
    });

    it('should grant a user application-wide permissions that they have', async () => {
      const { canActivate, isAdmin } = await service.can(user, [
        Action.ReadWorkspace,
      ]);
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(false);
    });

    it('should throw an error if the permissions for the given workspace id and user were not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new UserNotInWorkspaceException(
        user._id,
        workspaceId,
      ).message;
      try {
        await service.can(
          user,
          [Action.ReadWorkspace, Action.ReadDeployment],
          workspaceId,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should grant a workspace admin any workspace-wide permissions needed', async () => {
      const { canActivate, isAdmin } = await service.can(
        user,
        [
          Action.ReadWorkspace,
          Action.ProxyDeployment,
          Action.CreateProject,
          Action.DeleteWikiSection,
        ],
        workspaceId,
      );
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(true);
    });

    it('should not grant a workspace user any workspace-wide permissions they do not have', async () => {
      // Demote the user to the 'user' role workspace-wide
      permissions.workspaces.set(workspaceId, {
        roles: [Role.User],
        permissions: [
          Action.CreateDeployment,
          Action.ReadDeployment,
          Action.ProxyDeployment,
          Action.CreateWiki,
          Action.ReadWiki,
          Action.UpdateWiki,
          Action.DeleteWiki,
        ],
      });
      permissions = await permissionsModel
        .findOneAndUpdate({ _id: permissions._id }, permissions, { new: true })
        .exec();

      const { canActivate, isAdmin } = await service.can(
        user,
        [Action.ReadWorkspace, Action.DeleteDeployment],
        workspaceId,
      );
      expect(canActivate).toBe(false);
      expect(isAdmin).toBe(false);
    });

    it('should grant a workspace user any workspace-wide permissions they have', async () => {
      const { canActivate, isAdmin } = await service.can(
        user,
        [Action.ReadWorkspace, Action.CreateDeployment],
        workspaceId,
      );
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(false);
    });
  });
});
