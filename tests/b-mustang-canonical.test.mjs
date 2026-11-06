import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
test('all nine canonical assets match the approved manifest', () => {
 const script=fileURLToPath(new URL('../scripts/verify-b-mustang-canonical.mjs',import.meta.url));
 const output=execFileSync(process.execPath,[script],{encoding:'utf8'});
 assert.equal(output.trim().split('\n').length,9);
});
