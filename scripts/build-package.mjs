import { build } from 'vite';
import postcss from 'postcss';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const outDir = resolve('build');
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
// Resolve imports from the same source as the showcase. Keep the default layered API.
async function cssSource(file) {
  let source = await readFile(file, 'utf8');
  const matches = [...source.matchAll(/@import ['"](.+?)['"];?/g)];
  for (const match of matches) source = source.replace(match[0], await cssSource(resolve(file, '..', match[1])));
  return source;
}
for (const [name, file] of Object.entries({
  fruitui: 'src/fruitui.css',
  core: 'src/core.css',
  layout: 'src/layout.css',
  mail: 'src/mail.css',
  editor: 'src/editor.css',
})) {
  const source = await cssSource(resolve(file));
  await writeFile(`${outDir}/${name}.css`, source);
  // Legacy hosts cannot place their existing styles into layers. Generate, do not fork, the rules.
  const legacy = postcss.parse(source);
  legacy.walkAtRules('layer', rule => {
    if (rule.nodes) rule.replaceWith(...rule.nodes);
    else rule.remove();
  });
  legacy.walkRules(rule => {
    rule.selector = rule.selector
      // An optional ancestor class, the scope, then its classes, attributes and :not() conditions.
      .replace(/:where\(((?:\.[\w-]+ )?\.fruit-ui(?:\.[\w-]+|\[[^\]]*\]|:not\([^)]*\))*)\)/g, '$1')
      .replaceAll(':where(html.fruit-ui)', 'html.fruit-ui')
      .replaceAll(':where(.fruit-ui, .fruit-ui *)', '.fruit-ui, .fruit-ui *');
  });
  await writeFile(`${outDir}/${name}.compat.css`, legacy.toString());
}
// livewire.js registers itself on Livewire's injected Alpine; alpine and editor export plugins. The
// editor's global file registers itself too, so pages without a bundler only add a script tag.
// Both Alpine builds expose the same helpers as window.FruitUI for code outside Alpine.
const globals = { alpine: 'FruitUI', editor: 'FruitEditor', livewire: 'FruitUI' };
for (const [name, module, global] of [
  ['alpine', 'src/js/alpine.js', 'src/js/alpine.js'],
  ['editor', 'src/js/editor.js', 'src/js/editor-global.js'],
  ['livewire', 'src/js/livewire.js', 'src/js/livewire.js'],
]) {
  for (const [format, entry] of [
    ['es', module],
    ['iife', global],
  ]) {
    await build({
      configFile: false,
      // The showcase's public files (sample attachments) are not package assets.
      publicDir: false,
      logLevel: 'warn',
      build: {
        outDir,
        emptyOutDir: false,
        target: 'es2022',
        rolldownOptions: { output: { exports: name === 'alpine' ? 'named' : 'auto' } },
        lib: {
          entry: resolve(entry),
          name: globals[name],
          formats: [format],
          fileName: () => `${name}.${format === 'es' ? 'js' : 'global.js'}`,
        },
      },
    });
  }
}
