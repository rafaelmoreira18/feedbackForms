/**
 * Seed: creates military hospital tenants (RH only — no form templates).
 * rh_admin users will be created manually after.
 *
 * Run: npm run seed:military-tenants
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../modules/tenants/tenant.entity';

dotenv.config();

const MILITARY_TENANTS = [
  { slug: 'hmab', name: 'Hospital Militar de Área de Brasília - DF' },
  { slug: 'hrte', name: 'Hospital Regional de Tefé - AM' },
  { slug: 'uhtb', name: 'Unidade Hospitalar de Tabatinga - AM' },
  { slug: 'uhhu', name: 'Unidade Hospitalar de Humaitá - AM' },
  { slug: 'uti-hmab', name: 'UTI - Hospital Militar de Área de Brasília' },
  { slug: 'uti-tefe', name: 'UTI - Tefé' },
  { slug: 'uti-tabatinga', name: 'UTI - Tabatinga' },
  { slug: 'uti-humaita', name: 'UTI - Humaitá' },
];

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'feedbackforms',
    entities: [TenantEntity],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
  });
  await ds.initialize();
  console.log(`Connected to ${process.env.DB_DATABASE || 'feedbackforms'}`);

  const tenantRepo = ds.getRepository(TenantEntity);

  for (const def of MILITARY_TENANTS) {
    const existing = await tenantRepo.findOne({ where: { slug: def.slug } });
    if (existing) {
      console.log(`  Already exists: ${existing.name} (${existing.slug})`);
    } else {
      await tenantRepo.save(tenantRepo.create({ slug: def.slug, name: def.name }));
      console.log(`  Created: ${def.name} (${def.slug})`);
    }
  }

  await ds.destroy();
  console.log('\nSeed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
