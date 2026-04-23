import { spawn, spawnSync, type ChildProcess } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

// ---------------------------------------------------------------------------
// Env loader (no external deps — works in any project)
// ---------------------------------------------------------------------------
const loadEnvFile = (filePath: string): void => {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^export\s+/, '');
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    const val = raw.replace(/^(["'])(.*)(\1)$/, '$2');
    if (key && !(key in process.env)) process.env[key] = val;
  }
};

loadEnvFile(join(process.cwd(), '.env.local'));
loadEnvFile(join(process.cwd(), '.env'));

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
const PREFIX = '\x1b[35m[dev-bitrix]\x1b[0m';
const log = (msg: string): void => console.info(`${PREFIX} ${msg}`);
const fail = (msg: string): never => {
  console.error(`${PREFIX} ${msg}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// Framework detection
// ---------------------------------------------------------------------------
type DevServerConfig = {
  executable: string;
  args: string[];
  port: number;
  label: string;
  env?: NodeJS.ProcessEnv;
};

const resolveLocalBin = (name: string): string => {
  const ext = process.platform === 'win32' ? '.cmd' : '';
  const local = join(process.cwd(), 'node_modules', '.bin', name + ext);
  return existsSync(local) ? local : name;
};

const detectPackageManager = (): 'npm' | 'pnpm' | 'yarn' | 'bun' => {
  const ua = process.env.npm_config_user_agent ?? '';
  if (ua.startsWith('pnpm')) return 'pnpm';
  if (ua.startsWith('yarn')) return 'yarn';
  if (ua.startsWith('bun')) return 'bun';
  if (ua.startsWith('npm')) return 'npm';
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  return 'npm';
};

const detectDevServer = (): DevServerConfig => {
  const port = Number(process.env.DEV_PORT) || 0;

  if (process.env.DEV_COMMAND) {
    const [cmd, ...args] = process.env.DEV_COMMAND.split(/\s+/).filter(Boolean);
    return { executable: cmd, args, port: port || 3000, label: 'dev' };
  }

  const pkgPath = join(process.cwd(), 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['next']) {
      let nextBin: string;
      try { nextBin = require.resolve('next/dist/bin/next'); }
      catch { nextBin = resolveLocalBin('next'); }
      const effectivePort = port || 3000;
      return {
        executable: process.execPath,
        args: [nextBin, 'dev', '--port', String(effectivePort)],
        port: effectivePort,
        label: 'next',
      };
    }

    if (deps['nuxt']) {
      const effectivePort = port || 3000;
      return {
        executable: resolveLocalBin('nuxt'),
        args: ['dev', '--port', String(effectivePort)],
        port: effectivePort,
        label: 'nuxt',
      };
    }

    if (deps['astro']) {
      const effectivePort = port || 4321;
      return {
        executable: resolveLocalBin('astro'),
        args: ['dev', '--port', String(effectivePort)],
        port: effectivePort,
        label: 'astro',
      };
    }

    if (deps['@remix-run/dev']) {
      const effectivePort = port || 3000;
      return {
        executable: resolveLocalBin('remix'),
        args: ['vite:dev'],
        port: effectivePort,
        label: 'remix',
        env: { ...process.env, PORT: String(effectivePort) },
      };
    }

    if (deps['react-scripts']) {
      const effectivePort = port || 3000;
      return {
        executable: resolveLocalBin('react-scripts'),
        args: ['start'],
        port: effectivePort,
        label: 'cra',
        env: { ...process.env, PORT: String(effectivePort), BROWSER: 'none' },
      };
    }

    if (deps['vite']) {
      const effectivePort = port || 5173;
      return {
        executable: resolveLocalBin('vite'),
        args: ['--port', String(effectivePort), '--strictPort'],
        port: effectivePort,
        label: 'vite',
      };
    }
  }

  const pm = detectPackageManager();
  const executable = process.platform === 'win32' ? `${pm}.cmd` : pm;
  return {
    executable,
    args: ['run', 'dev'],
    port: port || 3000,
    label: pm,
  };
};

// ---------------------------------------------------------------------------
// cloudflared binary resolution
// ---------------------------------------------------------------------------
const resolveCloudflaredBin = (): string => {
  if (process.env.CLOUDFLARED_BIN) return process.env.CLOUDFLARED_BIN;

  const finder = process.platform === 'win32' ? 'where' : 'which';
  const check = spawnSync(finder, ['cloudflared'], { encoding: 'utf8' });
  if (check.status === 0) {
    const first = check.stdout.split(/\r?\n/).find(Boolean)?.trim();
    if (first) return first;
  }

  if (process.platform === 'win32') {
    const candidates: string[] = [
      'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
      'C:\\Program Files\\cloudflared\\cloudflared.exe',
    ];
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      candidates.push(join(
        localAppData,
        'Microsoft', 'WinGet', 'Packages',
        'Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe',
        'cloudflared.exe',
      ));
    }
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
  }

  return 'cloudflared';
};

// ---------------------------------------------------------------------------
// Process helpers
// ---------------------------------------------------------------------------
const prefixStream = (
  child: ChildProcess,
  label: string,
  channel: 'stdout' | 'stderr',
): void => {
  const stream = child[channel];
  if (!stream) return;
  const rl = createInterface({ input: stream });
  rl.on('line', line => {
    const writer = channel === 'stderr' ? process.stderr : process.stdout;
    writer.write(`${label} ${line}\n`);
  });
};

const killTree = (child: ChildProcess): void => {
  if (!child.pid || child.killed) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
  }
};

// ---------------------------------------------------------------------------
// Launchers
// ---------------------------------------------------------------------------
const launchDevServer = (config: DevServerConfig): ChildProcess => {
  log(`dev server: ${config.executable} ${config.args.join(' ')}`);
  // Node 20+ blocks .cmd/.bat spawns without shell:true (CVE-2024-27980).
  // When shell is enabled, cmd.exe splits the command string on spaces, so paths
  // with spaces must be pre-quoted.
  const useShell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(config.executable);
  const executable = useShell && config.executable.includes(' ')
    ? `"${config.executable}"`
    : config.executable;
  const child = spawn(executable, config.args, {
    cwd: process.cwd(),
    env: config.env ?? process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: useShell,
    windowsVerbatimArguments: useShell,
  });
  const label = `\x1b[36m[${config.label}]\x1b[0m`;
  prefixStream(child, label, 'stdout');
  prefixStream(child, label, 'stderr');
  return child;
};

const launchTunnel = (): ChildProcess => {
  const token = process.env.CLOUDFLARE_TUNNEL_TOKEN;
  if (!token) {
    fail(
      'CLOUDFLARE_TUNNEL_TOKEN no encontrado en .env.local\n' +
      '  → Cloudflare Zero Trust → Networks → Tunnels → tu tunnel → Configure → Token',
    );
  }

  const bin = resolveCloudflaredBin();
  log(`cloudflare binary: ${bin}`);

  const child = spawn(bin, ['tunnel', 'run', '--token', token!], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });

  const label = '\x1b[33m[cloudflare]\x1b[0m';
  prefixStream(child, label, 'stdout');
  prefixStream(child, label, 'stderr');
  return child;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const run = (): void => {
  const tunnelOnly = process.env.TUNNEL_ONLY === '1';
  const devConfig = tunnelOnly ? null : detectDevServer();
  const tunnelUrl = process.env.TUNNEL_URL;

  log(`modo: ${tunnelOnly ? 'tunnel-only' : `${devConfig!.label} + cloudflare`}`);
  if (devConfig) log(`puerto local: ${devConfig.port}`);
  if (tunnelUrl) log(`URL pública: ${tunnelUrl}`);

  const devServer = devConfig ? launchDevServer(devConfig) : null;
  const tunnel = launchTunnel();

  tunnel.on('error', err => fail(`no pude arrancar cloudflared: ${err.message}`));

  let shuttingDown = false;
  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    log('bajando procesos...');
    if (devServer) killTree(devServer);
    killTree(tunnel);
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  devServer?.on('exit', code => {
    log(`dev server terminó (code=${code ?? 0})`);
    if (!shuttingDown) { killTree(tunnel); process.exit(code ?? 0); }
  });

  tunnel.on('exit', code => {
    log(`tunnel terminó (code=${code ?? 0})`);
    if (!shuttingDown) {
      if (devServer) killTree(devServer);
      process.exit(code ?? 0);
    }
  });
};

run();
