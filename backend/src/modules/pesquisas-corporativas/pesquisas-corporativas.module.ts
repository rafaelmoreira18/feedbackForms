import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PesquisaCorporativaEntity } from './entities/pesquisa-corporativa.entity';
import { PesquisaRespostaEntity } from './entities/pesquisa-resposta.entity';
import { PesquisasCorporativasController } from './pesquisas-corporativas.controller';
import { PesquisasRespostasController } from './pesquisas-respostas.controller';
import { PesquisasCorporativasService } from './pesquisas-corporativas.service';
import { PesquisasRespostasService } from './pesquisas-respostas.service';
import { TenantModule } from '../tenants/tenant.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PesquisaCorporativaEntity, PesquisaRespostaEntity]),
    TenantModule,
    AuditLogModule,
  ],
  controllers: [PesquisasCorporativasController, PesquisasRespostasController],
  providers: [PesquisasCorporativasService, PesquisasRespostasService],
  exports: [PesquisasCorporativasService, PesquisasRespostasService],
})
export class PesquisasCorporativasModule {}
