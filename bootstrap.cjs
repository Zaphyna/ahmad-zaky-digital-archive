const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const crypto = require('node:crypto');

const expectedSha256 = 'ca203e7c23573e7fe203d8685685e6c0aeef1e1ca0879a657de645a214f9480a';
const parts = fs.readdirSync(process.cwd())
  .filter((name) => /^azb-user-source\.b64\.\d+$/.test(name))
  .sort((a, b) => Number(a.split('.').pop()) - Number(b.split('.').pop()));

if (!parts.length) throw new Error('AZB user ZIP source parts are missing');

const encoded = parts.map((name) => fs.readFileSync(path.join(process.cwd(), name), 'utf8')).join('');
const archive = Buffer.from(encoded, 'base64');
const actualSha256 = crypto.createHash('sha256').update(archive).digest('hex');

if (actualSha256 !== expectedSha256) {
  throw new Error(`AZB source checksum mismatch: ${actualSha256}`);
}

const archivePath = path.join(process.cwd(), 'azb-user-source.tar.gz');
fs.writeFileSync(archivePath, archive);
cp.execFileSync('tar', ['-xzf', archivePath, '--strip-components=1'], { stdio: 'inherit' });
console.log('Canonical source from the user ZIP extracted successfully');
