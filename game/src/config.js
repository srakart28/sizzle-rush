// config.js — Sizzle Rush: every ingredient, recipe and shift-tuning number lives here.
// An ingredient travels a prep path: each step names the station that performs it.
// "board" = chopping board, "pan" = the stove pan. An empty path means ready as-is.

export const INGREDIENTS = {
  bun:     { label: 'Bun',     prep: [],               colors: ['#f2c063', '#d99a35'] },
  patty:   { label: 'Patty',   prep: ['pan'],          colors: ['#a5522f', '#7e3a1e'] },
  chicken: { label: 'Chicken', prep: ['pan'],          colors: ['#f0b27a', '#d18a4a'] },
  egg:     { label: 'Egg',     prep: ['pan'],          colors: ['#fdf6d8', '#f5b921'] },
  potato:  { label: 'Potato',  prep: ['board', 'pan'], colors: ['#d9b380', '#b98d4f'] },
  lettuce: { label: 'Lettuce', prep: ['board'],        colors: ['#7ec850', '#4f9e2f'] },
  tomato:  { label: 'Tomato',  prep: ['board'],        colors: ['#ef5350', '#c62828'] },
  cheese:  { label: 'Cheese',  prep: [],               colors: ['#ffd54f', '#f0a51e'] },
};

// The order board draws the pantry bins in this order; number keys 1-8 match it.
export const PANTRY_ORDER = ['bun', 'patty', 'chicken', 'egg', 'potato', 'lettuce', 'tomato', 'cheese'];

// A recipe is the exact set of finished items a plate must hold to serve it.
// prepIndex counts how many prep steps of that ingredient must be done:
// the plate item must be fully prepped (its prep path exhausted) to match.
export const RECIPES = [
  { id: 'fries',   name: 'Crispy Fries',   price: 10, needs: ['potato'],                          unlock: 1 },
  { id: 'salad',   name: 'Orchard Salad',  price: 12, needs: ['lettuce', 'tomato', 'cheese'],     unlock: 1 },
  { id: 'burger',  name: 'Ember Burger',   price: 14, needs: ['bun', 'patty', 'cheese'],          unlock: 1 },
  { id: 'omelette', name: 'Sunrise Omelette', price: 16, needs: ['egg', 'cheese', 'tomato'],      unlock: 1 },
  { id: 'garden',  name: 'Garden Burger',  price: 18, needs: ['bun', 'patty', 'lettuce', 'tomato'], unlock: 2 },
  { id: 'hunter',  name: "Hunter's Plate", price: 22, needs: ['chicken', 'potato'],               unlock: 2 },
  { id: 'royal',   name: 'Royal Stack',    price: 26, needs: ['bun', 'patty', 'chicken', 'cheese', 'lettuce'], unlock: 3 },
];

export const SHIFTS = [
  null, // shifts are 1-based
  { length: 150, spawnEvery: 8.5, patience: 52, starScores: [90, 170, 260] },
  { length: 150, spawnEvery: 7.0, patience: 46, starScores: [130, 230, 340] },
  { length: 165, spawnEvery: 5.8, patience: 40, starScores: [170, 300, 440] },
];

export const CHOP_TIME = 1.5;   // seconds on the board per chopping step
export const COOK_TIME = 4.2;   // seconds in the pan before an item is cooked
export const BURN_TIME = 3.0;   // extra seconds in the pan before it burns
export const MAX_ORDERS = 3;
export const START_HEARTS = 3;

// Canvas logical size; main.js scales it to the window.
export const VIEW_W = 1280;
export const VIEW_H = 720;
