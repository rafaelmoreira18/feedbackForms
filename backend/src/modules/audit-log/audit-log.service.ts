import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity, AuditAction } from './audit-log.entity';

export interface AuditContext {
  tenantId: string;
  userId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  /**
   * Registra uma acao de auditoria de forma assincrona e sem lancar excecoes —
   * nunca deve bloquear ou derrubar a operacao principal.
   */
  async record(
    ctx: AuditContext,
    action: AuditAction,
    entityType: string,
    entityId: string | null,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const entry = this.repo.create({
        tenantId: ctx.tenantId,
        userId: ctx.userId ?? null,
        userEmail: ctx.userEmail ?? null,
        action,
        entityType,
        entityId,
        ipAddress: ctx.ipAddress ?? null,
        details: details ?? null,
      });
      await this.repo.save(entry);
    } catch (err) {
      // Nunca propagar erro de auditoria para nao afetar a operacao principal
      this.logger.error(`[AUDIT] Falha ao registrar ${action} entity=${entityType}/${entityId}: ${err}`);
    }
  }
}
