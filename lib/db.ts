import { neon } from '@neondatabase/serverless';
export function db(){const u=process.env.DATABASE_URL; return u?neon(u):null}
