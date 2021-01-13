import { deploymentImages } from './../deployment-images';
import { DeploymentImage } from './../schemas/deployment.schema';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

/**
 * Validates the given deployment image
 */
@ValidatorConstraint({ name: 'isValidDeploymentImage', async: false })
class IsValidDeploymentImage implements ValidatorConstraintInterface {
  validate(image: DeploymentImage) {
    return (
      image &&
      image.name &&
      image.tag &&
      deploymentImages.findIndex(
        (i) => i.name === image.name && i.tag === image.tag,
      ) !== -1
    );
  }

  defaultMessage() {
    return 'image is not one of the allowed deployment images';
  }
}

export class CreateDeploymentImageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  tag: string;
}

export class CreateDeploymentResourcesDto {
  @Min(1)
  @IsInt()
  cpuCount: number;

  @Min(2)
  @IsInt()
  memoryCount: number;

  @Min(8)
  @IsInt()
  @IsOptional()
  storageCount: number;
}

export class CreateDeploymentPropertiesDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateDeploymentImageDto)
  @Validate(IsValidDeploymentImage)
  image: CreateDeploymentImageDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateDeploymentResourcesDto)
  resources: CreateDeploymentResourcesDto;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  sudoPassword: string;
}

export class CreateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  name: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateDeploymentPropertiesDto)
  properties: CreateDeploymentPropertiesDto;
}