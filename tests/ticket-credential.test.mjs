import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';

async function credentialParser() {
  const source = await readFile(new URL('../src/lib/ticket-credential.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const commonJsModule = { exports: {} };
  new Function('exports', 'module', compiled)(commonJsModule.exports, commonJsModule);
  return commonJsModule.exports.parseTicketCredential;
}

const id = '74298cd8-7356-4f95-8622-f130b812133a';
const secret = 'a'.repeat(64);

test('ticket parser accepts native QR payloads and normalises pasted whitespace', async () => {
  const parse = await credentialParser();
  const result = parse(`  ET1.${id.toUpperCase()}.${secret.toUpperCase()}\n`);
  assert.deepEqual(result, { id, secret, credential: `ET1.${id}.${secret}` });
});

test('ticket parser accepts a shared ticket URL as a gate fallback', async () => {
  const parse = await credentialParser();
  const result = parse(`https://tickets.example.test/tickets/${id}?key=${secret}`);
  assert.equal(result?.credential, `ET1.${id}.${secret}`);
});

test('ticket parser rejects malformed or incomplete codes', async () => {
  const parse = await credentialParser();
  assert.equal(parse(`ET1.${id}.short`), null);
  assert.equal(parse(`https://tickets.example.test/tickets/${id}`), null);
  assert.equal(parse('https://example.test/not-a-ticket'), null);
});
