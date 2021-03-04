import { Controller } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';

@Controller('api/authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}
}
