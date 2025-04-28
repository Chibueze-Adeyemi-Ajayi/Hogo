import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthUser = createParamDecorator((data, req: ExecutionContext) => {
  let request = req.switchToHttp().getRequest().headers["user"];
  return request;
});