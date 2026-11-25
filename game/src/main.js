// main.js — Sizzle Rush boot: canvas sizing, the frame loop, the screen-reader
// status line, and the ?shot= screenshot scenes used to take the entry's pictures.

import { VIEW_W, VIEW_H } from './config.js';
import { Kitchen } from './world.js';
import { SoundKit } from './audio.js';
import { drawFrame } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const sound = new SoundKit();
const kitchen = new Kitchen(sound);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) applyShot(kitchen, shot);

const hover = attachInput(canvas, kitchen, sound);

// A handle for local play-testing scripts: they drive the real UI with
// synthetic clicks and read this state to confirm the dish actually served.
window.sizzleRush = kitchen;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

let lastHint = '';
let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  kitchen.update(dt);
  drawFrame(ctx, kitchen, now / 1000, hover.current);
  const hint = kitchen.phase === 'playing' ? kitchen.hint() : '';
  if (hint !== lastHint) {
    lastHint = hint;
    status.textContent = hint;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
