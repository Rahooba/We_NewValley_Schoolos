import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts'
  },
  // Direct connection URL is used by the Prisma CLI for migrations (DDL is not
  // allowed through the pgbouncer transaction pooler).
  datasource: {
    url: env('DIRECT_URL')
  }
});
