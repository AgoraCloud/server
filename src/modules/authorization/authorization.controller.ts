import { Controller, Get, Body, Put, Param, Delete } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { UpdateAuthorizationDto } from './dto/update-authorization.dto';

@Controller('api/authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authorizationService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAuthorizationDto: UpdateAuthorizationDto,
  ) {
    return this.authorizationService.update(id, updateAuthorizationDto);
  }
}
