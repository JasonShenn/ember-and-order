// main.js — Ember & Order: boots the game, owns the loop and every player action.
// The rules live in the small modules; this file wires them together:
// grab -> process -> plate -> serve, plus the level clock, rush hour and screens.

import { createOrderBoard, tickOrderBoard, findMatchingOrder, activeOrders } from './orders.js';
import { createStations, placeOnStation, takeFromStation, tickStations, stationAccepts } from './cooking-stations.js';
import { createPlates, addToPlate, takeFromPlate, clearPlate, plateWants, plateMatchesRecipe } from './plating.js';
import { createScore, scoreServe, scoreExpired, scoreBurnt } from './scoring.js';
import { levelDef, isRushHour, starsForScore } from './levels.js';
import { RECIPE_LIST, INGREDIENTS } from './recipes.js';
import { computeLayout, drawGame, spawnSparkle, spawnFloater } from './render-kitchen.js';
import { attachInput } from './input.js';
import { sfx, setMuted, unlockAudio, startSizzle, stopSizzle } from './audio.js';
import { seedDemo } from './demo.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const layout = computeLayout();
const statusEl = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  canvas.style.width = `${Math.floor(1280 * scale)}px`;
  canvas.style.height = `${Math.floor(720 * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function freshState(level) {
  const def = levelDef(level);
  return {
    screen: 'title',
    level,
    levelTimeLeft: def.duration,
    elapsed: 0,
    board: createOrderBoard(level),
    stations: createStations(),
    plates: createPlates(),
    hand: null,
    score: createScore(),
    rush: false,
    paused: false,
    frozen: false,
    muted: false,
    particles: [],
    floaters: [],
    mouse: { x: -100, y: -100 },
    lastStars: 0,
    gameOverReason: '',
  };
}

let state = freshState(1);

// Demo mode (?demo=cover|cooking|serving|rush): frozen showcase state for screenshots.
const demoKind = new URLSearchParams(window.location.search).get('demo');
if (demoKind) {
  state = seedDemo(demoKind);
  state.elapsed = 0;
}

function startLevel(level) {
  const keepScore = state.score;
  state = freshState(level);
  state.score = keepScore;
  state.score.earnedThisLevel = 0;
  state.screen = 'playing';
  announce(`第 ${level} 夜开始：出 ${levelDef(level).quota} 单`);
}

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function platePosition(index) {
  const p = layout.plates[index];
  return { x: p.x, y: p.y - p.r - 10 };
}

// Can this plate still become a real dish if we add this item?
function plateCouldBecome(plate, ingredientId) {
  const contents = [...plate.items, ingredientId];
  return RECIPE_LIST.some((recipe) => {
    const remaining = [...recipe.items];
    for (const item of contents) {
      const i = remaining.indexOf(item);
      if (i < 0) return false;
      remaining.splice(i, 1);
    }
    return true;
  });
}

const handlers = {
  getScreen() {
    return state.screen;
  },

  onMouseMove(pos) {
    state.mouse.x = pos.x;
    state.mouse.y = pos.y;
  },

  onBin(id) {
    if (state.screen !== 'playing' || state.paused || state.frozen) return;
    unlockAudio();
    if (state.hand) { sfx.error(); return; }
    state.hand = id;
    sfx.pickup();
  },

  onStation(kind) {
    if (state.screen !== 'playing' || state.paused || state.frozen) return;
    unlockAudio();
    const st = state.stations.find((s) => s.kind === kind);
    if (!st) return;
    if (state.hand) {
      if (stationAccepts(st, state.hand)) {
        placeOnStation(st, state.hand);
        state.hand = null;
        sfx.place();
      } else {
        sfx.error();
        const pos = layout.stations.find((r) => r.kind === kind);
        spawnFloater(state, pos.x + pos.w / 2, pos.y + 30, st.state === 'empty' ? '这里不加工它' : '已经有东西在做了', '#ff8a80', 14);
      }
      return;
    }
    const taken = takeFromStation(st);
    if (taken) {
      state.hand = taken;
      if (taken === 'burnt') {
        scoreBurnt(state.score);
        sfx.burnt();
        spawnFloater(state, st === state.stations[0] ? 400 : 600, 240, '烧焦了！快扔掉', '#ff8a80', 16);
      } else {
        sfx.pickup();
      }
    } else if (st.state === 'working') {
      sfx.error();
      const pos = layout.stations.find((r) => r.kind === kind);
      spawnFloater(state, pos.x + pos.w / 2, pos.y + 30, '还没好，再等一下', '#ffd9a0', 14);
    }
  },

  onPlate(index) {
    if (state.screen !== 'playing' || state.paused || state.frozen) return;
    unlockAudio();
    const plate = state.plates[index];
    if (state.hand) {
      const handId = state.hand;
      if (plate.items.length >= 4) { sfx.error(); return; }
      if (!plateCouldBecome(plate, handId) && !plateWants(plate, handId, state.board.orders)) {
        sfx.error();
        const pos = platePosition(index);
        spawnFloater(state, pos.x, pos.y, '这道菜不需要它', '#ff8a80', 14);
        return;
      }
      addToPlate(plate, handId);
      state.hand = null;
      sfx.place();
      return;
    }
    // Empty hand: serve a finished plate, or take the last item back.
    const recipe = plateMatchesRecipe(plate, RECIPE_LIST);
    if (recipe) {
      const order = findMatchingOrder(state.board, plate.items);
      if (order) {
        servePlate(index, order, recipe);
        return;
      }
      sfx.error();
      const pos = platePosition(index);
      spawnFloater(state, pos.x, pos.y, '还没人点这道菜', '#ffd9a0', 14);
      return;
    }
    if (plate.items.length > 0) {
      state.hand = takeFromPlate(plate);
      sfx.pickup();
    }
  },

  onTrash() {
    if (state.screen !== 'playing' || state.paused || state.frozen) return;
    if (!state.hand) return;
    const wasBurnt = state.hand === 'burnt';
    state.hand = null;
    sfx.place();
    if (wasBurnt) spawnFloater(state, 924, 500, '扔掉了', '#c9a37a', 14);
  },

  onPause() {
    if (state.screen === 'playing') {
      state.paused = !state.paused;
      sfx.click();
    }
  },

  onMute() {
    state.muted = !state.muted;
    setMuted(state.muted);
    sfx.click();
  },

  onStart() {
    if (state.screen !== 'title') return;
    unlockAudio();
    sfx.bell();
    startLevel(1);
  },

  onNext() {
    if (state.screen !== 'levelComplete') return;
    unlockAudio();
    sfx.bell();
    startLevel(state.level + 1);
  },

  onRetry() {
    if (state.screen !== 'gameOver' && state.screen !== 'win') return;
    unlockAudio();
    sfx.bell();
    state.score = createScore();
    startLevel(1);
  },

  onConfirm() {
    if (state.screen === 'title') handlers.onStart();
    else if (state.screen === 'levelComplete') handlers.onNext();
    else if (state.screen === 'gameOver' || state.screen === 'win') handlers.onRetry();
  },

  onEmptyClick() { /* clicking empty counter space does nothing */ },
};

function servePlate(index, order, recipe) {
  const plate = state.plates[index];
  const result = scoreServe(state.score, order, state.rush);
  order.state = 'served';
  state.board.servedThisLevel += 1;
  clearPlate(plate);
  plate.flash = 1;
  const pos = platePosition(index);
  spawnSparkle(state, layout.plates[index].x, layout.plates[index].y);
  spawnFloater(state, pos.x, pos.y, `+¥${result.earned}`, '#ffd94d', 24);
  spawnFloater(state, pos.x, pos.y + 26, `小费 ¥${result.tip} · 连击 x${result.combo}`, '#fff2dd', 14);
  sfx.serve();
  announce(`出菜：${recipe.name}，收入 ¥${result.earned}`);
}

attachInput(canvas, layout, handlers);

// ---------------------------------------------------------------- game loop

let lastNow = performance.now();

function frame(now) {
  // Re-register first: one bad frame must never freeze the game.
  requestAnimationFrame(frame);
  const rawDt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  state.elapsed += rawDt;

  if (state.screen === 'playing' && !state.paused && !state.frozen) {
    const dt = rawDt;
    state.levelTimeLeft -= dt;
    state.rush = isRushHour(state.level, state.levelTimeLeft);

    const before = activeOrders(state.board).length;
    const { expired } = tickOrderBoard(state.board, dt, state.levelTimeLeft);
    if (activeOrders(state.board).length > before) sfx.ticket();
    for (const order of expired) {
      const penalty = scoreExpired(state.score);
      spawnFloater(state, 640, 110, `客人走了 -¥${penalty}`, '#ff8a80', 18);
      sfx.error();
      announce(`订单超时：${order.dishName} 的客人走了`);
    }

    for (const event of tickStations(state.stations, dt)) {
      if (event.type === 'station-done') {
        sfx.done();
        const rect = layout.stations.find((r) => r.kind === event.station.kind);
        spawnFloater(state, rect.x + rect.w / 2, rect.y + 30, '好了！', '#9be15d', 16);
      } else if (event.type === 'station-burnt') {
        scoreBurnt(state.score);
        sfx.burnt();
      }
    }

    const anyWorking = state.stations.some((s) => s.state === 'working');
    if (anyWorking) startSizzle();
    else stopSizzle();

    // Level ends: quota met, or the clock ran out.
    const def = levelDef(state.level);
    if (state.board.servedThisLevel >= def.quota) {
      state.lastStars = starsForScore(state.level, state.score.earnedThisLevel);
      stopSizzle();
      sfx.levelClear();
      state.screen = state.level >= 3 ? 'win' : 'levelComplete';
      announce(state.screen === 'win' ? '三夜全满贯！' : `第 ${state.level} 夜完成`);
    } else if (state.levelTimeLeft <= 0) {
      state.levelTimeLeft = 0;
      state.gameOverReason = `时间到，只出了 ${state.board.servedThisLevel}/${def.quota} 单。`;
      stopSizzle();
      sfx.gameOver();
      state.screen = 'gameOver';
      announce('打烊了：时间到');
    }
  }

  drawGame(ctx, state, layout, state.frozen ? 0 : rawDt);
}

requestAnimationFrame(frame);

// Expose a tiny debug handle so automated play-tests can drive the game.
window.__emberAndOrder = {
  get state() { return state; },
  startLevel,
  handlers,
  layout,
};
