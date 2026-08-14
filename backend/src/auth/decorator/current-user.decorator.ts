import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // Injecté automatiquement par le JwtAuthGuard

    // Si on passe un paramètre spécifique ex: @CurrentUser('id')
    return data ? user?.[data] : user;
  },
);