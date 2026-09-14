import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
const exec = promisify(execFile);
const source = `import { render } from './.ssr/entry-server.js'; import { createHash } from 'node:crypto'; console.log(createHash('sha256').update(render({path:'/2027/',buildYear:2026}).html).digest('hex'));`;
const zones = ['UTC', 'Europe/Warsaw', 'America/Los_Angeles', 'Pacific/Auckland'];
const hashes = await Promise.all(zones.map(async TZ => (await exec(process.execPath, ['--input-type=module', '-e', source], { env: { ...process.env, TZ } })).stdout.trim()));
assert.equal(new Set(hashes).size, 1, `HTML depends on timezone: ${JSON.stringify(Object.fromEntries(zones.map((zone, i) => [zone, hashes[i]])))}`);
console.log('Identical calendar HTML in UTC, Warsaw, Los Angeles and Auckland.');
