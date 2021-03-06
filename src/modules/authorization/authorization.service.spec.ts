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
      workspaces: new Map(),
    });
    permission.workspaces.set(workspaceId, {
      roles: [Role.User],
      permissions: [
        Action.CreateDeployment,
        Action.ReadDeployment,
        Action.UpdateDeployment,
        Action.DeleteDeployment,
      ],
    });
    await permissionsModel.create(permission);
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw an error if the permission for the given user was not found', async () => {
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

  describe('can', () => {
    it('should return true if the user has sufficient permissions', async () => {
      const can: boolean = await service.can(
        user,
        [Action.ReadWorkspace, Action.CreateDeployment],
        workspaceId,
      );
      expect(can).toBe(true);
    });

    it('should return false if the user does not have sufficient permissions', async () => {
      const can: boolean = await service.can(
        user,
        [Action.ReadWorkspace, Action.ReadDeployment, Action.ProxyDeployment],
        workspaceId,
      );
      expect(can).toBe(false);
    });
  });
});
