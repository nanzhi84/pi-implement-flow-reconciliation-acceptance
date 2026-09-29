import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.env.FLOW_RESOURCE_DIR;
if (!root) throw new Error('FLOW_RESOURCE_DIR required');
const mode = process.argv[2];
if (mode === 'prepare') {
  if (process.env.FLOW_FIXTURE_FAIL_PREPARE === '1') throw new Error('Injected preparation failure');
  if (process.env.FLOW_FIXTURE_CHANGE_HEAD === '1') execFileSync('git', ['checkout', '--detach', 'HEAD^'], { stdio: 'pipe' });
  await mkdir(join(root, 'data'), { recursive: true });
} else if (mode === 'cleanup') {
  await rm(join(root, 'data'), { recursive: true, force: true });
} else if (mode === 'check') {
  execFileSync(process.execPath, ['--check', 'app.mjs'], { stdio: 'pipe' });
} else if (mode === 'accept') {
  const greeting = execFileSync(process.execPath, ['app.mjs', 'Ada'], { encoding: 'utf8' });
  if (greeting !== 'Hello, Ada!\n') throw new Error('greeting contract failed');
  let rejected = false;
  try { execFileSync(process.execPath, ['app.mjs'], { stdio: 'pipe' }); }
  catch (error) { rejected = error.status === 2; }
  if (!rejected) throw new Error('missing-name contract failed');
  const assertRejected = (args, label) => {
    let failure;
    try { execFileSync(process.execPath, ['app.mjs', ...args], { encoding: 'utf8', stdio: 'pipe' }); }
    catch (error) { failure = error; }
    if (!failure || failure.status !== 2 || failure.stdout !== '') {
      throw new Error(`${label} contract failed`);
    }
  };
  assertRejected([], 'missing-name-empty-stdout');
  for (const name of ['', '   ', '\t', '\f', '\v', '\u00a0', '\u2003', ' \t\f\v\u00a0\u2003']) {
    assertRejected([name], 'whitespace-only-rejected');
  }
  for (const name of ['Ada\r', 'Ada\n', 'A\r\nda']) {
    assertRejected([name], 'line-break-rejected');
  }
  for (const name of [' Ada ', '\t\f\v\u00a0\u2003Ada\u2003\u00a0\v\f\t', '\u200b']) {
    const actual = execFileSync(process.execPath, ['app.mjs', name], { encoding: 'utf8' });
    if (actual !== `Hello, ${name}!\n`) throw new Error('accepted-name-preserved contract failed');
  }
  process.stdout.write(JSON.stringify({ passed: true, assertions: [
    { name: 'greeting-for-name', passed: true },
    { name: 'missing-name-rejected', passed: true },
    { name: 'whitespace-only-rejected', passed: true },
    { name: 'missing-name-empty-stdout', passed: true },
    { name: 'line-break-rejected', passed: true },
    { name: 'accepted-name-preserved', passed: true },
  ] }) + '\n');
} else {
  throw new Error('Unsupported fixture phase');
}
