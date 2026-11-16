import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { claimHome, resolveHome, safeEnvironment, main } from '../../../plugins/boundaryxp/scripts/launch.mjs';

test('unrelated existing directories and invalid markers are preserved', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'bxp-isolation-'));
  const sentinel = path.join(home, 'existing-task.json');
  await fs.writeFile(sentinel, 'original task bytes');
  await assert.rejects(claimHome(home), /not an empty plugin home/);
  assert.equal(await fs.readFile(sentinel, 'utf8'), 'original task bytes');
  assert.deepEqual(await fs.readdir(home), ['existing-task.json']);
  await fs.writeFile(path.join(home, 'plugin-owner.json'), '{"kind":"OTHER"}');
  await assert.rejects(claimHome(home), /another installation/);
  assert.equal(await fs.readFile(sentinel, 'utf8'), 'original task bytes');
});

test('owned empty directory can reconnect without rewriting records', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'bxp-owner-'));
  await claimHome(home);
  await fs.writeFile(path.join(home, 'saved-task'), 'retain');
  await claimHome(home);
  assert.equal(await fs.readFile(path.join(home, 'saved-task'), 'utf8'), 'retain');
});

test('path and command arguments fail closed; secrets are not passed to children', async () => {
  assert.throws(() => resolveHome({ BXP_PLUGIN_HOME: 'relative' }), /BXP_HOME/);
  assert.throws(() => resolveHome({ BXP_PLUGIN_HOME: path.parse(process.cwd()).root }), /BXP_HOME/);
  await assert.rejects(main(['--data-root','arbitrary']), /BXP_ARGS/);
  assert.deepEqual(safeEnvironment({ Path:'safe-path', SystemRoot:'os', OPENAI_API_KEY:'secret', CURSOR_API_KEY:'secret', BOUNDARYXP_API_KEY:'secret', NODE_OPTIONS:'--import=evil', npm_config_registry:'evil', BXP_PLUGIN_HOME:'private-home' }), { Path:'safe-path', SystemRoot:'os' });
});
