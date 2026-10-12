import ts from 'typescript';
import { readFile } from 'node:fs/promises';
export async function siteEvents() {
 const source=await readFile(new URL('../../src/data/events.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const commonJsModule={exports:{}};
 new Function('exports','module',compiled)(commonJsModule.exports,commonJsModule);
 return commonJsModule.exports.events;
}
