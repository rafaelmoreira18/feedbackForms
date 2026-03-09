import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantEntity } from '../../modules/tenants/tenant.entity';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant as TenantEntity;
  },
);
