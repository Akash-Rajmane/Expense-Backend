import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  // Handle both Fastify and Express
  if (request.user && request.user.id) {
    return request.user.id;
  }
  throw new Error('User not found in request');
});
