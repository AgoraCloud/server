import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithIsAdmin } from 'src/utils/requests.interface';

export const IsAdmin = createParamDecorator((ctx: ExecutionContext) => {
  const request: RequestWithIsAdmin = ctx.switchToHttp().getRequest();
  return request.isAdmin;
});
