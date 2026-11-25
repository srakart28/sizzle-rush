// shots.js — deterministic scenes for the entry's screenshots, following the
// kit's own pattern: open game/index.html?shot=<name>&seed=1 in a browser and
// the game poses itself. Gameplay timers freeze; only steam, lights and the
// chef's idle motion keep moving, so every render shows the same moment.

import { RECIPES } from './config.js';
import { makeItem } from './world.js';

function recipe(id) {
  return RECIPES.find((r) => r.id === id);
}

function order(id, patience, patienceMax) {
  return { recipe: recipe(id), patience, patienceMax, faceSeed: 1234 + id.length * 777, shake: 0 };
}

function fullyPrepped(ing) {
  const item = makeItem(ing);
  // stage counts finished steps; set it from the ingredient's own path
  item.stage = { bun: 0, cheese: 0, patty: 1, chicken: 1, egg: 1, lettuce: 1, tomato: 1, potato: 2 }[ing];
  return item;
}

export function applyShot(k, name) {
  k.frozen = true;
  k.phase = 'playing';
  k.shift = 1;
  k.hearts = 3;
  if (name === 'rush') {
    // The cover: mid-rush, everything happening at once.
    k.timeLeft = 88;
    k.score = 132; k.earned = 132; k.served = 5; k.lost = 0;
    k.combo = 4; k.bestCombo = 5;
    k.orders = [order('garden', 30, 52), order('burger', 44, 52), order('salad', 20, 52)];
    k.plate = [fullyPrepped('bun'), fullyPrepped('patty')];
    k.board = { item: makeItem('tomato'), progress: 0.55, chopTick: 0.2 };
    k.pan = { item: makeItem('chicken'), elapsed: 2.6, announced: false };
    k.chef.x = 560; k.chef.targetX = 560;
  } else if (name === 'chop') {
    k.timeLeft = 121;
    k.score = 46; k.earned = 46; k.served = 2;
    k.combo = 2; k.bestCombo = 2;
    k.orders = [order('omelette', 40, 52), order('fries', 47, 52)];
    k.plate = [fullyPrepped('egg')];
    k.board = { item: makeItem('lettuce'), progress: 0.45, chopTick: 0.2 };
    k.pan = null;
    k.chef.x = 560; k.chef.targetX = 560;
  } else if (name === 'serve') {
    k.timeLeft = 74;
    k.score = 98; k.earned = 98; k.served = 4;
    k.combo = 3; k.bestCombo = 3;
    k.orders = [order('burger', 26, 52), order('salad', 38, 52)];
    k.plate = [fullyPrepped('bun'), fullyPrepped('patty'), fullyPrepped('cheese')];
    k.board = null;
    // An egg that has just finished in the pan: timer ring full, READY label.
    k.pan = { item: makeItem('egg'), elapsed: 5.0, announced: true };
    k.chef.x = 684; k.chef.targetX = 684;
  } else if (name === 'end') {
    k.phase = 'results';
    k.timeLeft = 0;
    k.score = 286; k.earned = 286; k.served = 11; k.lost = 1;
    k.combo = 0; k.bestCombo = 6;
    k.stars = 3;
    k.orders = [];
    k.plate = [];
    k.board = null;
    k.pan = null;
    k.chef.x = 640; k.chef.targetX = 640;
  }
}
