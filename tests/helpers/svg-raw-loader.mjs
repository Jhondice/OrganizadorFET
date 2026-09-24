// Vite entiende de forma nativa `import x from './icono.svg?raw'` (devuelve el archivo como
// texto). Node no lo conoce, así que este "loader hook" (API estable desde Node 20.6/22)
// lo traduce por él únicamente durante `npm test`; el bundle de producción lo resuelve Vite
// directamente y este archivo no interviene para nada en él.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.svg?raw')) {
    const result = await nextResolve(specifier.slice(0, -4), context);
    return { ...result, url: `${result.url}?raw` };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.svg?raw')) {
    const source = await readFile(fileURLToPath(url.slice(0, -4)), 'utf8');
    return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(source)};` };
  }
  return nextLoad(url, context);
}
