import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { AuthorizationController } from './authorization.controller';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { AbilityFactory } from './ability-factory.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [AuthorizationController],
  providers: [AuthorizationService, AbilityFactory],
})
export class AuthorizationModule {}
