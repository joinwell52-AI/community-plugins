import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const VERSION = '0.4.0-rc.9';
const pluginRoot = fileURLToPath(new URL('../', import.meta.url));
const owner = { kind: 'BOUNDARYXP_COMMUNITY_PLUGIN', schema: 1 };

export function assertSupported(platform = process.platform, arch = process.arch, version = process.versions.node) {
  if (platform !== 'win32' || arch !== 'x64') throw new Error('BXP_PLATFORM: this compiled release supports Windows x64 only. No installation was attempted.');
  const [major, minor] = version.split('.').map(Number);
  if (!(major > 22 || (major === 22 && minor >= 19))) throw new Error('BXP_NODE: use Node.js >=22.19 with its bundled npm.');
}

export function resolveHome(env = process.env) {
  const base = env.BXP_PLUGIN_HOME || path.join(env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'BoundaryXP', 'CommunityPlugin');
  if (!path.isAbsolute(base) || base.includes('\0') || path.resolve(base) === path.parse(path.resolve(base)).root) {
    throw new Error('BXP_HOME: choose an absolute, non-root directory dedicated to this plugin.');
  }
  return path.resolve(base);
}

export async function claimHome(home) {
  await fs.mkdir(home, { recursive: true });
  if ((await fs.lstat(home)).isSymbolicLink()) throw new Error('BXP_HOME: symlink/junction homes are not supported.');
  const marker = path.join(home, 'plugin-owner.json');
  let existing;
  try { existing = JSON.parse(await fs.readFile(marker, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error('BXP_HOME: invalid owner marker; existing content was retained.');
    if ((await fs.readdir(home)).length) throw new Error('BXP_HOME: directory is not an empty plugin home; existing content was retained.');
    try { await fs.writeFile(marker, JSON.stringify(owner), { flag: 'wx' }); }
    catch (writeError) { if (writeError.code !== 'EEXIST') throw writeError; }
    existing = JSON.parse(await fs.readFile(marker, 'utf8'));
  }
  if (existing.kind !== owner.kind || existing.schema !== owner.schema) throw new Error('BXP_HOME: directory belongs to another installation.');
}

export function safeEnvironment(env = process.env) {
  // Forward OS facilities, not provider credentials, NODE_OPTIONS or proxy secrets.
  const allowed = new Set(['path','systemroot','windir','comspec','pathext','temp','tmp','userprofile','localappdata','appdata','homedrive','homepath','systemdrive','programfiles','programfiles(x86)','programw6432']);
  return Object.fromEntries(Object.entries(env).filter(([key]) => allowed.has(key.toLowerCase())));
}

function waitForChild(child, label) {
  return new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error(`${label}: could not start child process.`)));
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${label}: child exited (${code ?? signal}). See stderr; no automatic retry.`)));
  });
}

export async function ensureRuntime(home) {
  const specDir = path.join(pluginRoot, 'runtime');
  const lock = await fs.readFile(path.join(specDir, 'package-lock.json'));
  const lockSha256 = createHash('sha256').update(lock).digest('hex');
  const runtime = path.join(home, `runtime-${VERSION}`);
  const receipt = path.join(runtime, 'plugin-runtime.json');
  try {
    const saved = JSON.parse(await fs.readFile(receipt, 'utf8'));
    const pkg = JSON.parse(await fs.readFile(path.join(runtime, 'node_modules/boundaryxp-mcp/package.json'), 'utf8'));
    if (saved.version !== VERSION || saved.lock_sha256 !== lockSha256 || pkg.version !== VERSION) throw new Error('BXP_RUNTIME: installed runtime identity differs; retain data and review installation.');
    return path.join(runtime, 'node_modules/boundaryxp-mcp/server.mjs');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    try { await fs.access(runtime); throw new Error('BXP_RUNTIME: incomplete runtime exists; it was retained for inspection.'); }
    catch (accessError) { if (accessError.code !== 'ENOENT') throw accessError; }
  }
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  try { await fs.access(npmCli); }
  catch { throw new Error('BXP_NPM: install Node with bundled npm; npm-cli.js was not found beside node.exe.'); }
  const lockDir = path.join(home, 'install.lock');
  try { await fs.mkdir(lockDir); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('BXP_BUSY: another installation may be running. Wait for it, then reconnect. Stale locks require manual inspection.'); throw error; }
  try {
    const stage = await fs.mkdtemp(path.join(home, 'staging-'));
    await fs.copyFile(path.join(specDir, 'package.json'), path.join(stage, 'package.json'));
    await fs.writeFile(path.join(stage, 'package-lock.json'), lock);
    console.error(`BoundaryXP: installing pinned ${VERSION} from registry.npmjs.org (no lifecycle scripts).`);
    const child = spawn(process.execPath, [npmCli, 'ci', '--prefix', stage, '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org', '--cache', path.join(home, 'npm-cache')], {
      cwd: stage, env: safeEnvironment(), windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe']
    });
    child.stdout.pipe(process.stderr); child.stderr.pipe(process.stderr);
    const timer = setTimeout(() => child.kill(), 240_000);
    try { await waitForChild(child, 'BXP_INSTALL'); } finally { clearTimeout(timer); }
    const pkg = JSON.parse(await fs.readFile(path.join(stage, 'node_modules/boundaryxp-mcp/package.json'), 'utf8'));
    if (pkg.version !== VERSION) throw new Error('BXP_RUNTIME: unexpected package version.');
    await fs.writeFile(path.join(stage, 'plugin-runtime.json'), JSON.stringify({ version: VERSION, lock_sha256: lockSha256 }));
    await fs.rename(stage, runtime);
    return path.join(runtime, 'node_modules/boundaryxp-mcp/server.mjs');
  } finally { await fs.rmdir(lockDir); }
}

export async function main(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== '--install-only') || args.length > 1) throw new Error('BXP_ARGS: only --install-only is supported. Configure BXP_PLUGIN_HOME for an isolated home.');
  assertSupported();
  const home = resolveHome();
  await claimHome(home);
  const server = await ensureRuntime(home);
  const profiles = path.join(home, 'host-profiles.json');
  try { await fs.writeFile(profiles, '{"profiles":[]}', { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  // This plugin intentionally exposes host mode only. The standalone package
  // documents optional provider profiles without silently inheriting API keys.
  const profileConfig = JSON.parse(await fs.readFile(profiles, 'utf8'));
  if (!Array.isArray(profileConfig.profiles) || profileConfig.profiles.length) throw new Error('BXP_PROFILE: plugin requires an empty profiles list for host mode. Existing file was retained.');
  if (args.includes('--install-only')) { console.log(JSON.stringify({ version: VERSION, ready: true })); return; }
  const child = spawn(process.execPath, [server, '--data-root', path.join(home, 'data-rc9'), '--profiles', profiles], {
    cwd: home, env: safeEnvironment(), windowsHide: true, shell: false, stdio: 'inherit'
  });
  const stop = () => child.kill();
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try { await waitForChild(child, 'BXP_MCP'); }
  finally { process.off('SIGINT', stop); process.off('SIGTERM', stop); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
