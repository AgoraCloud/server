import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  Role,
  InWorkspaceActions,
  Action,
} from './../schemas/permission.schema';

export class UpdateWorkspaceUserPermissionsDto {
  // TODO: length of this must be 1 only
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn([Role.User, Role.WorkspaceAdmin], { each: true })
  roles: [Role.User | Role.WorkspaceAdmin];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn(InWorkspaceActions, { each: true })
  permissions: Action[];
}
