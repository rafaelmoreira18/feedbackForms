import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { TenantService } from '../../modules/tenants/tenant.service';

/**
 * Base class for controllers that need to validate tenant access.
 * Extend this and pass tenantService to super() in the constructor.
 *
 * Rules:
 *  - holding_admin can access any tenant
 *  - rh_admin with tenantId === null is a global RH (can access any tenant)
 *  - All other roles can only access their own tenant
 */
export abstract class BaseTenantController {
  constructor(protected readonly tenantService: TenantService) {}

  /**
   * Resolves the tenantId from the slug and asserts the user has access.
   * Returns the resolved tenantId.
   */
  protected async resolveAndAssertTenant(slug: string, req: Request): Promise<string> {
    const tenant = await this.tenantService.findBySlug(slug);
    const user = req.user as { role: string; tenantId: string | null };
    const isGlobal =
      user.role === 'holding_admin' ||
      (user.role === 'rh_admin' && user.tenantId === null);
    if (!isGlobal && user.tenantId !== tenant.id) {
      throw new ForbiddenException('Acesso negado a este tenant');
    }
    return tenant.id;
  }
}
