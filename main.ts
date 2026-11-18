// TIDELINE's entrypoint: the grader runs this twice in a container with no network, a read-only
// /bot (this repository at the submitted commit) and a writable /output. It copies the playable
// game and its screenshots across and writes dossier.json, the summary the house judge reads, so
// both runs must produce identical bytes — nothing here reads the clock or the random source.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps, copied from the kit's reference/gate.json.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const IMAGE = /\.(png|jpe?g|webp)$/i;

function report(line) {
  process.stdout.write(`tideline: ${line}\n`);
}

// A quick look at what is about to be handed in: the page, the shots and their weight.
function inspect(inDir) {
  const page = join(inDir, 'game', 'index.html');
  if (!existsSync(page)) throw new Error('game/index.html is missing: the gate would refuse this entry');
  report(`game/index.html ${statSync(page).size} bytes`);
  const shotsDir = join(inDir, 'screenshots');
  const shots = existsSync(shotsDir)
    ? readdirSync(shotsDir).filter((name) => IMAGE.test(name)).sort()
    : [];
  if (shots.length < 3) throw new Error(`only ${shots.length} screenshots: three are required`);
  const heavy = shots.filter((name) => statSync(join(shotsDir, name)).size > CAPS.screenshots.max_bytes);
  if (heavy.length) throw new Error(`screenshots over 256 KiB: ${heavy.join(', ')}`);
  report(`screenshots: ${shots.join(', ')}`);
  return shots;
}

function stage(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(join(source, 'game'), join(target, 'game'), { recursive: true });
  const shots = inspect(source);
  mkdirSync(join(target, 'screenshots'), { recursive: true });
  for (const name of shots) cpSync(join(source, 'screenshots', name), join(target, 'screenshots', name));
}

stage(root, outDir);
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, CAPS));
report(`dossier ${statSync(join(outDir, 'dossier.json')).size} bytes written to ${outDir}`);