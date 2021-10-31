import { TokenExpiredException } from './../../exceptions/token-expired.exception';
import { DateUtil } from './../../utils/date.util';
import { User, UserSchema } from './../users/schemas/user.schema';
import { TokenNotFoundException } from './../../exceptions/token-not-found.exception';
import { UserDocument } from '../users/schemas/user.schema';
import {
  Token,
  TokenSchema,
  TokenType,
  TokenDocument,
} from './schemas/token.schema';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from './tokens.service';
import { Connection, Types } from 'mongoose';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
} as UserDocument;

let token: TokenDocument;

describe('TokensService', () => {
  let service: TokensService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [TokensService],
    }).compile();

    service = module.get<TokensService>(TokensService);
    connection = await module.get(getConnectionToken());
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a token', async () => {
      const tokenToCreate: Token = new Token({
        type: TokenType.ChangePassword,
        user,
        expiresAt: new Date(),
      });
      const createdToken: TokenDocument = await service.create(tokenToCreate);
      expect(createdToken.type).toBe(tokenToCreate.type);
      expect(createdToken.user._id).toBe(user._id);
      expect(createdToken.expiresAt).toBe(tokenToCreate.expiresAt);
      token = createdToken;
    });
  });

  describe('findOneAndRemove', () => {
    it('should throw an error if the token was not found', async () => {
      const tokenId = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new TokenNotFoundException(tokenId)
        .message;
      try {
        await service.findOneAndRemove(tokenId, token.type);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the token and remove it', async () => {
      const retrievedToken: TokenDocument = await service.findOneAndRemove(
        token._id,
        token.type,
      );
      expect(retrievedToken._id).toEqual(token._id);
      expect(retrievedToken.type).toBe(token.type);
    });
  });

  describe('isTokenExpired', () => {
    it('should throw an exception if the token is expired', () => {
      const expectedErrorMessage: string = new TokenExpiredException(token._id)
        .message;
      try {
        service.isTokenExpired(token);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should not throw an exception if the token is not expired', () => {
      token.expiresAt = DateUtil.addDays(new Date());
      try {
        service.isTokenExpired(token);
      } catch (err) {
        fail('It should not throw an error');
      }
    });
  });
});
