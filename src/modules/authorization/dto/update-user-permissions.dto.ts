import { IsIn, IsNotEmpty, IsString, Validate } from 'class-validator';
import { Role, Action, WorkspaceActions } from './../schemas/permission.schema';

export class UpdateUserPermissionsDto {
  // TODO: length of this must be 1 only
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Validate((value: Role[]) => value.length === 1)
  @IsIn([Role.User, Role.SuperAdmin], { each: true })
  roles: [Role.User | Role.SuperAdmin];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn(WorkspaceActions, { each: true })
  permissions: Action[];
}
