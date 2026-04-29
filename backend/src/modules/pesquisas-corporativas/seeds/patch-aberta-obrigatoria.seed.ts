import { DataSource } from 'typeorm';
import { PesquisaCorporativaEntity } from '../entities/pesquisa-corporativa.entity';
import { TenantEntity } from '../../tenants/tenant.entity';

async function run() {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [PesquisaCorporativaEntity, TenantEntity],
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
  });

  await ds.initialize();
  const repo = ds.getRepository(PesquisaCorporativaEntity);

  const pesquisa = await repo.findOne({ where: { slug: 'clima-soft-skills-2026' } });
  if (!pesquisa) {
    console.log('Pesquisa não encontrada.');
    await ds.destroy();
    return;
  }

  let updated = 0;
  pesquisa.blocos = pesquisa.blocos.map(bloco => ({
    ...bloco,
    perguntas: bloco.perguntas.map(p => {
      if (p.escala === 'aberta' && !p.obrigatoria) {
        updated++;
        return { ...p, obrigatoria: true };
      }
      return p;
    }),
  }));

  await repo.save(pesquisa);
  console.log(`Patch aplicado — ${updated} pergunta(s) aberta(s) marcada(s) como obrigatória(s).`);
  await ds.destroy();
}

run().catch(e => { console.error(e); process.exit(1); });
