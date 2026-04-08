/**
 * Seed: creates the Mediall Sede/Matriz tenant (RH only — no feedback form templates).
 * This tenant appears in the /treinamentos selector so trainings held at headquarters
 * can be registered independently.
 *
 * Run: npm run seed:mediall-sede
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../modules/tenants/tenant.entity';

dotenv.config();

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
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
  });
  await ds.initialize();
  console.log(`Connected to ${process.env.DB_DATABASE || 'feedbackforms'}`);

  const tenantRepo = ds.getRepository(TenantEntity);

  const existing = await tenantRepo.findOne({ where: { slug: 'mediall' } });
  if (existing) {
    console.log(`  Already exists: ${existing.name} (${existing.slug})`);
  } else {
    await tenantRepo.save(
      tenantRepo.create({
        slug: 'mediall',
        name: 'Mediall - Sede/Matriz',
        hasFeedbackForms: false,
        active: true,
      }),
    );
    console.log('  Created: Mediall - Sede/Matriz (mediall)');
  }

  await ds.destroy();
  console.log('\nSeed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
