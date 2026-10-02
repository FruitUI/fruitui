import { mkdirSync, openSync } from 'node:fs';
import { spawn } from 'node:child_process';
mkdirSync('tests/host/.runtime', { recursive: true });
const log = openSync('tests/host/.runtime/server.log', 'w');
const server = spawn('php', ['-S', '127.0.0.1:5180', '-t', 'tests/host/public', 'tests/host/public/index.php'], { stdio: ['ignore', log, log] });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', code => process.exit(code || 0));
