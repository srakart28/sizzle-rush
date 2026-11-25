// Sizzle Rush — Ember Kitchen: the hand-in program for make.fun's
// "Make the best cooking game" bounty (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a
// desktop browser; it plays fully offline). This program hands the entry in:
// it copies game/ and screenshots/ into the output directory and writes
// dossier.json there with buildDossier from the vendored kit library, under
// the scorer's own caps, so the dossier the judge reads is exactly the one
// the gate rebuilds. Outside the grader, MAKEFUN_OUTPUT_DIR names the
// output directory:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the game locally with: node serve.ts  (then open the printed URL)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
