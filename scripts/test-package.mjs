import { mkdtemp, readFile, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const temp = await mkdtemp(join(tmpdir(), 'fruitui-package-'));
try {
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', temp], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }),
  )[0];
  await writeFile(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temp, packed.filename)], {
    cwd: temp,
    stdio: 'pipe',
  });
  const installed = join(temp, 'node_modules/fruitui');
  for (const file of [
    'src/core.css',
    'build/core.compat.css',
    'build/layout.compat.css',
    'build/alpine.js',
    'build/editor.js',
    'build/livewire.global.js',
    'src/js/livewire.js',
    'docs/component-policy.md',
    'docs/component-catalog.json',
    'docs/adoption.md',
    'CHANGELOG.md',
  ])
    await access(join(installed, file));
  const manifest = JSON.parse(await readFile(join(temp, 'package-lock.json'), 'utf8'));
  assert(!manifest.packages['node_modules/@tiptap/core'], 'Core consumers must not install an editor automatically');
  await writeFile(
    join(temp, 'smoke.mjs'),
    `import fruitUI, {fruitToast, toast, confirm, fruitConfirmer, dialog} from 'fruitui/alpine'; import bundled from 'fruitui/dist/alpine.js'; const registrations=[]; fruitUI({data:name=>registrations.push(name), magic:name=>registrations.push('$'+name)}); if(!registrations.includes('fruitToast') || typeof bundled !== 'function' || typeof fruitToast !== 'function' || typeof toast !== 'function' || !registrations.includes('$toast') || typeof confirm !== 'function' || typeof fruitConfirmer !== 'function' || !registrations.includes('fruitConfirmer') || !registrations.includes('$confirm') || typeof dialog !== 'function' || !registrations.includes('$dialog')) throw Error('Missing helpers'); console.log('Packaged imports, docs, compiled assets and optional peers verified');`,
  );
  execFileSync(process.execPath, ['smoke.mjs'], { cwd: temp, stdio: 'inherit' });
} finally {
  await rm(temp, { recursive: true, force: true });
}
