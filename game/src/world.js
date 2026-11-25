// world.js — Sizzle Rush game state and rules. No drawing, no DOM: this file
// owns the shift clock, the order board, the chef's hands, the chopping board,
// the pan, the plate, scoring, combos and hearts. Render reads it; input calls it.

import {
  INGREDIENTS, RECIPES, SHIFTS, CHOP_TIME, COOK_TIME, BURN_TIME,
  MAX_ORDERS, START_HEARTS,
} from './config.js';
import { makeRandom, pickRandom } from './random.js';

// An item is { ing, stage, burnt }: stage counts finished prep steps, so a
// fully prepped item has stage === INGREDIENTS[ing].prep.length.
export function makeItem(ing) {
  return { ing, stage: 0, burnt: false };
}

export function nextStation(item) {
  if (!item || item.burnt) return null;
  const path = INGREDIENTS[item.ing].prep;
  return item.stage < path.length ? path[item.stage] : null;
}

export function isReady(item) {
  return item && !item.burnt && nextStation(item) === null;
}

export function itemName(item) {
  if (!item) return '';
  const base = INGREDIENTS[item.ing].label;
  if (item.burnt) return `Burnt ${base}`;
  const path = INGREDIENTS[item.ing].prep;
  if (item.stage === 0) return base;
  const done = path[item.stage - 1];
  if (item.ing === 'potato' && item.stage === 2) return 'Crispy Fries';
  if (item.ing === 'potato' && item.stage === 1) return 'Cut Potato';
  return `${done === 'board' ? 'Chopped' : 'Cooked'} ${base}`;
}

export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = plate.map((it) => (isReady(it) ? it.ing : null));
  if (have.includes(null)) return false;
  const sortedHave = [...have].sort();
  const sortedNeed = [...recipe.needs].sort();
  return sortedHave.every((ing, i) => ing === sortedNeed[i]);
}

export class Kitchen {
  constructor(sound, seed = 20261125) {
    this.sound = sound;
    this.rng = makeRandom(seed);
    this.phase = 'title'; // 'title' | 'playing' | 'results'
    this.shift = 1;
    this.chef = { x: 640, targetX: 640, facing: 1, walkPhase: 0, chopArm: 0 };
    this.particles = [];
    this.floaters = [];
    this.resetShift(1);
  }

  resetShift(shift) {
    const cfg = SHIFTS[shift];
    this.shift = shift;
    this.score = 0;
    this.earned = 0;
    this.served = 0;
    this.lost = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hearts = START_HEARTS;
    this.timeLeft = cfg.length;
    this.spawnIn = 0.4;
    this.orders = [];
    this.hands = null;
    this.board = null; // { item, progress, chopTick }
    this.pan = null;   // { item, elapsed, announced }
    this.plate = [];
    this.stars = 0;
    this.newBest = false;
  }

  startShift(shift) {
    this.resetShift(shift);
    this.phase = 'playing';
  }

  unlockedRecipes() {
    return RECIPES.filter((r) => r.unlock <= this.shift);
  }

  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const cfg = SHIFTS[this.shift];
    const recipe = pickRandom(this.rng, this.unlockedRecipes());
    const patience = cfg.patience * (0.9 + this.rng() * 0.25);
    this.orders.push({
      recipe,
      patience,
      patienceMax: patience,
      faceSeed: Math.floor(this.rng() * 100000),
      shake: 0,
    });
    this.sound.pop();
  }

  addFloater(x, y, text, color = '#fff') {
    this.floaters.push({ x, y, text, color, life: 1.4 });
  }

  burst(x, y, colors, n = 10, speed = 130) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.3 + this.rng() * 0.7);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
        life: 0.5 + this.rng() * 0.5, maxLife: 1,
        color: colors[Math.floor(this.rng() * colors.length) % colors.length],
        size: 2 + this.rng() * 3.5,
      });
    }
  }

  steam(x, y) {
    this.particles.push({
      x: x + (this.rng() - 0.5) * 26, y,
      vx: (this.rng() - 0.5) * 12, vy: -34 - this.rng() * 26,
      life: 1.1, maxLife: 1.1, color: 'rgba(255,255,255,0.5)', size: 5 + this.rng() * 6, steam: true,
    });
  }

  // ---- player actions (input.js calls these; x is where the chef walks to) ----

  moveChefTo(x) { this.chef.targetX = x; }

  takeFromPantry(ing, x) {
    this.moveChefTo(x);
    if (this.hands) { this.addFloater(x, 300, 'Hands full!', '#ffd54f'); this.sound.buzz(); return; }
    this.hands = makeItem(ing);
    this.sound.pickup();
  }

  clickBoard(x) {
    this.moveChefTo(x);
    if (this.board) {
      if (this.board.progress < 1) {
        // A click on the board is an extra chop: faster, with a thunk.
        this.board.progress = Math.min(1, this.board.progress + 0.22);
        this.chef.chopArm = 0.18;
        this.sound.chop();
        if (this.board.progress >= 1) this.finishChop(x);
      } else if (!this.hands) {
        this.hands = this.board.item;
        this.board = null;
        this.sound.pickup();
      }
      return;
    }
    if (this.hands && nextStation(this.hands) === 'board') {
      this.board = { item: this.hands, progress: 0, chopTick: 0 };
      this.hands = null;
      this.sound.place();
    } else if (this.hands) {
      this.addFloater(x, 300, `${INGREDIENTS[this.hands.ing].label} needs no chopping`, '#ffd54f');
      this.sound.buzz();
    }
  }

  finishChop(x) {
    this.board.item.stage += 1;
    this.addFloater(x, 292, itemName(this.board.item), '#aeea7a');
    this.burst(x, 330, ['#ffffff', '#ffe082'], 6, 70);
    this.sound.ding();
  }

  clickPan(x) {
    this.moveChefTo(x);
    if (this.pan) {
      const { item, elapsed } = this.pan;
      if (item.burnt) {
        this.addFloater(x, 292, 'Burnt — scrapped', '#ef9a9a');
        this.pan = null;
        this.sound.buzz();
      } else if (elapsed >= COOK_TIME && !this.hands) {
        this.hands = item;
        this.pan = null;
        this.sound.pickup();
      } else if (elapsed < COOK_TIME) {
        this.addFloater(x, 292, 'Still cooking…', '#ffd54f');
      }
      return;
    }
    if (this.hands && nextStation(this.hands) === 'pan') {
      this.pan = { item: this.hands, elapsed: 0, announced: false };
      this.hands = null;
      this.sound.place();
    } else if (this.hands) {
      this.addFloater(x, 292, `${INGREDIENTS[this.hands.ing].label} does not go in the pan`, '#ffd54f');
      this.sound.buzz();
    }
  }

  clickPlate(x) {
    this.moveChefTo(x);
    if (this.hands) {
      if (isReady(this.hands)) {
        this.plate.push(this.hands);
        this.addFloater(x, 292, `${itemName(this.hands)} plated`, '#aeea7a');
        this.hands = null;
        this.sound.place();
        this.burst(x, 350, ['#fff59d', '#ffffff'], 5, 60);
      } else {
        const st = nextStation(this.hands);
        this.addFloater(x, 292, st === 'board' ? 'Chop it first!' : 'Cook it first!', '#ffd54f');
        this.sound.buzz();
      }
      return;
    }
    if (this.plate.length) {
      this.hands = this.plate.pop();
      this.sound.pickup();
    }
  }

  clickTrash(x) {
    this.moveChefTo(x);
    if (this.hands) {
      this.addFloater(x, 292, `${itemName(this.hands)} binned`, '#ef9a9a');
      this.hands = null;
      this.sound.buzz();
    } else if (this.plate.length) {
      this.plate = [];
      this.addFloater(x, 292, 'Plate cleared', '#ef9a9a');
      this.sound.buzz();
    }
  }

  clickOrder(index, x, y) {
    const order = this.orders[index];
    if (!order) return;
    this.moveChefTo(x);
    if (plateMatches(this.plate, order.recipe)) {
      const frac = Math.max(0, order.patience / order.patienceMax);
      const tip = Math.round(order.recipe.price * 0.6 * frac);
      const total = order.recipe.price + tip;
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.score += total;
      this.earned += total;
      this.served += 1;
      this.plate = [];
      this.orders.splice(index, 1);
      this.addFloater(x, y - 30, `+$${total}`, '#aeea7a');
      if (tip >= 6) this.addFloater(x, y - 58, 'Great tip!', '#fff59d');
      this.burst(x, y, ['#ffd54f', '#aeea7a', '#ffffff'], 16, 170);
      this.sound.ding();
      this.sound.coin();
    } else {
      order.shake = 0.35;
      this.addFloater(x, y - 30, this.plate.length ? 'Plate does not match' : 'Plate the dish first!', '#ffd54f');
      this.sound.buzz();
    }
  }

  hint() {
    if (this.phase !== 'playing') return '';
    if (this.hands) {
      const st = nextStation(this.hands);
      if (this.hands.burnt) return 'Bin the burnt item, then start it again.';
      if (st === 'board') return `Take the ${INGREDIENTS[this.hands.ing].label.toLowerCase()} to the chopping board.`;
      if (st === 'pan') return `Get the ${INGREDIENTS[this.hands.ing].label.toLowerCase()} into the pan — mind it does not burn.`;
      return `${itemName(this.hands)} is ready — click the plate to add it.`;
    }
    if (this.board && this.board.progress < 1) return 'Chopping… click the board to chop faster.';
    if (this.board) return 'Chopped and waiting — click the board to pick it up.';
    if (this.pan && this.pan.elapsed >= COOK_TIME && !this.pan.item.burnt) return 'The pan is done — click it before it burns!';
    const ready = this.orders.find((o) => plateMatches(this.plate, o.recipe));
    if (ready) return `${ready.recipe.name} is plated — click its order card to serve!`;
    if (this.plate.length) return 'Plate started. Fetch the next ingredient from the pantry.';
    if (this.orders.length) return 'Pick an order, then grab its first ingredient from the pantry.';
    return 'First customers are on their way…';
  }

  // ---- the clock ----

  update(dt) {
    // Particles and floaters always drift, even on the title screen.
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.steam) p.vy += 300 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) { f.life -= dt; f.y -= 26 * dt; }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    // The chef strolls toward whichever station was used last.
    const chef = this.chef;
    const dx = chef.targetX - chef.x;
    if (Math.abs(dx) > 4) {
      const step = Math.sign(dx) * Math.min(Math.abs(dx), 340 * dt);
      chef.x += step;
      chef.facing = step > 0 ? 1 : -1;
      chef.walkPhase += dt * 11;
    }
    if (chef.chopArm > 0) chef.chopArm -= dt;

    // Screenshot scenes freeze the clock but keep the pan steaming.
    if (this.frozen && this.pan && this.rng() < dt * 14) this.steam(884, 400);

    if (this.phase !== 'playing' || this.frozen) return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.endShift(); return; }

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      this.spawnIn = SHIFTS[this.shift].spawnEvery * (0.8 + this.rng() * 0.45);
    }

    for (let i = this.orders.length - 1; i >= 0; i--) {
      const order = this.orders[i];
      order.patience -= dt;
      if (order.shake > 0) order.shake -= dt;
      if (order.patience <= 0) {
        this.orders.splice(i, 1);
        this.lost += 1;
        this.combo = 0;
        this.hearts -= 1;
        this.addFloater(150 + i * 330, 120, 'Customer left!', '#ef9a9a');
        this.sound.buzz();
        if (this.hearts <= 0) { this.endShift(); return; }
      }
    }

    if (this.board && this.board.progress < 1) {
      this.board.progress = Math.min(1, this.board.progress + dt / CHOP_TIME);
      this.board.chopTick -= dt;
      if (this.board.chopTick <= 0) {
        this.board.chopTick = 0.3;
        this.chef.chopArm = 0.15;
        this.sound.chop();
      }
      if (this.board.progress >= 1) this.finishChop(this.chef.x);
    }

    if (this.pan) {
      const pan = this.pan;
      pan.elapsed += dt;
      if (this.rng() < dt * 14) this.steam(880, 400);
      if (pan.elapsed >= COOK_TIME && !pan.announced) {
        pan.announced = true;
        pan.item.stage += 1; // the cook step is done: the item is now cooked
        this.addFloater(880, 292, `${itemName(pan.item)} ready!`, '#aeea7a');
        this.sound.ding();
      }
      if (pan.elapsed >= COOK_TIME + BURN_TIME && !pan.item.burnt) {
        pan.item.burnt = true;
        this.addFloater(880, 292, 'Burnt!', '#ef9a9a');
        this.burst(880, 400, ['#616161', '#424242', '#9e9e9e'], 12, 90);
        this.sound.burn();
      }
    }
    this.sound.setSizzle(!!this.pan);
  }

  endShift() {
    this.phase = 'results';
    const thresholds = SHIFTS[this.shift].starScores;
    this.stars = thresholds.filter((t) => this.score >= t).length;
    this.sound.setSizzle(false);
    this.sound.ding();
  }
}
