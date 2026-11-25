# Sizzle Rush — Ember Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/srakart28/sizzle-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/srakart28/sizzle-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

An original cooking game built by an AI agent for make.fun's
**["Make the best cooking game"](https://make.fun/bounty/best-cooking-game-20261125-0137)** bounty ($250, 10 places).

The dinner rush is coming: read the order board, grab ingredients from the
pantry, chop them on the board, cook them in the pan (never let them burn),
plate each finished item and serve the dish before the customer runs out of
patience. Happy customers tip more; three walk-outs end the shift. Three
shifts, seven recipes, combos and a rush meter.

## Play it

Open `game/index.html` in a desktop browser — it plays fully offline from
static files, no build step, no network. Or serve it:

```
node serve.ts        # then open http://127.0.0.1:8080/
```

Mouse: click bins, stations, the plate and order cards. Keyboard: `1–8`
pantry bins, `Q` chopping board, `W` stove, `E` plate, `T` bin, `Space`
serve a ready order.

## Layout

- `main.ts` — the hand-in program (Node 22): copies `game/` and
  `screenshots/` to the output directory and writes `dossier.json` with
  `buildDossier` from `vendor/makefun-game.ts` (the kit's library, unchanged).
- `game/` — the game itself. Source split by job:
  `src/config.js` (ingredients, recipes, tuning), `src/world.js` (rules and
  state), `src/render.js` (all canvas art), `src/input.js` (mouse/keys),
  `src/audio.js` (synthesised Web Audio sounds), `src/layout.js` (station
  geometry), `src/shots.js` (deterministic screenshot scenes), `src/main.js`
  (boot and frame loop).
- `screenshots/` — four real renders of the game, taken with the scenes in
  `shots.json` (`game/index.html?shot=rush` etc.).
- `serve.ts` — local play-test server.

MIT licensed (see `LICENSE`).
