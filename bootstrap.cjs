const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');

const parts = fs.readdirSync(process.cwd())
  .filter((name) => /^source\.b64\.\d+$/.test(name))
  .sort((a, b) => Number(a.split('.').pop()) - Number(b.split('.').pop()));

if (!parts.length) throw new Error('AZB source bundle parts missing');

const encoded = parts
  .map((name) => fs.readFileSync(path.join(process.cwd(), name), 'utf8'))
  .join('');

const archive = path.join(process.cwd(), 'azb-source.tar.gz');
fs.writeFileSync(archive, Buffer.from(encoded, 'base64'));

for (const dir of ['app', 'lib']) {
  fs.rmSync(path.join(process.cwd(), dir), { recursive: true, force: true });
}

cp.execFileSync('tar', ['-xzf', archive, '--strip-components=1'], { stdio: 'inherit' });

fs.writeFileSync(
  path.join(process.cwd(), 'src/lib/db.ts'),
  `import { neon } from '@neondatabase/serverless';\n\ntype Row = Record<string, any>;\ntype DatabaseClient = (strings: TemplateStringsArray, ...values: any[]) => Promise<Row[]>;\n\nlet client: ReturnType<typeof neon> | null = null;\nlet typedClient: DatabaseClient | null = null;\n\nexport function db(): DatabaseClient | null {\n  if (!process.env.DATABASE_URL) return null;\n  if (!client) client = neon(process.env.DATABASE_URL);\n  if (!typedClient) typedClient = client as unknown as DatabaseClient;\n  return typedClient;\n}\n`
);

console.log('AZB final source extracted and database typings normalized');
