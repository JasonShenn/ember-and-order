// render-kitchen.js — draws the whole diner on one canvas: warm wall, ticket rail,
// pantry bins, the three stations, the pass with its plates, the recipe book and
// every overlay. computeLayout() is the single source of truth for hit-testing:
// input.js uses the same rectangles this file draws.

import { INGREDIENTS, PANTRY_ORDER, RECIPE_LIST } from './recipes.js';
import { orderUrgency } from './orders.js';
import { levelDef, isRushHour } from './levels.js';
import { drawIngredient, drawIngredientChip } from './render-food.js';
import { stationStatusText } from './cooking-stations.js';
import { plateMatchesRecipe } from './plating.js';

export const W = 1280;
export const H = 720;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

export function computeLayout() {
  const bins = [];
  for (let i = 0; i < PANTRY_ORDER.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    bins.push({
      id: PANTRY_ORDER[i],
      key: String(i + 1),
      x: 28 + col * 88,
      y: 210 + row * 112,
      w: 80,
      h: 104,
    });
  }
  const stations = ['board', 'grill', 'pot'].map((kind, i) => ({
    kind,
    x: 316 + i * 176,
    y: 176,
    w: 164,
    h: 224,
  }));
  const plates = [
    { x: 452, y: 516, r: 88 },
    { x: 700, y: 516, r: 88 },
  ];
  return {
    topBar: { x: 0, y: 0, w: W, h: 56 },
    pauseButton: { x: 1140, y: 10, w: 56, h: 36 },
    muteButton: { x: 1204, y: 10, w: 56, h: 36 },
    tickets: [0, 1, 2, 3].map((i) => ({ x: 16 + i * 306, y: 64, w: 296, h: 96 })),
    pantry: { x: 16, y: 176, w: 284, h: 380 },
    bins,
    stations,
    serveWindow: { x: 848, y: 176, w: 416, h: 224 },
    plates,
    trash: { x: 848, y: 416, w: 152, h: 200 },
    recipeBook: { x: 1016, y: 416, w: 248, h: 200 },
    bottomBar: { x: 0, y: 632, w: W, h: 88 },
    startButton: { x: 490, y: 520, w: 300, h: 64 },
    nextButton: { x: 490, y: 520, w: 300, h: 64 },
    retryButton: { x: 490, y: 520, w: 300, h: 64 },
  };
}

function pointIn(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function hitTest(layout, x, y, screen = 'playing') {
  if (pointIn(layout.pauseButton, x, y)) return { type: 'pause' };
  if (pointIn(layout.muteButton, x, y)) return { type: 'mute' };
  // On an overlay screen the button is the only live target: the kitchen
  // drawn dimmed behind it must not swallow the click.
  if (screen === 'title' || screen === 'levelComplete' || screen === 'gameOver' || screen === 'win') {
    if (pointIn(layout.startButton, x, y)) return { type: 'start' };
    if (pointIn(layout.nextButton, x, y)) return { type: 'next' };
    if (pointIn(layout.retryButton, x, y)) return { type: 'retry' };
    return null;
  }
  for (const bin of layout.bins) if (pointIn(bin, x, y)) return { type: 'bin', id: bin.id };
  for (const st of layout.stations) if (pointIn(st, x, y)) return { type: 'station', kind: st.kind };
  for (let i = 0; i < layout.plates.length; i++) {
    const p = layout.plates[i];
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy <= p.r * p.r) return { type: 'plate', index: i };
  }
  if (pointIn(layout.trash, x, y)) return { type: 'trash' };
  return null;
}

// ---------------------------------------------------------------- background

function drawBackground(ctx, state, t) {
  // warm plaster wall
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#3a2a22');
  wall.addColorStop(0.55, '#4a3226');
  wall.addColorStop(1, '#2c1e17');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  // tiled backsplash band behind the counters
  ctx.fillStyle = '#5d4030';
  ctx.fillRect(0, 160, W, 8);
  for (let x = 0; x < W; x += 46) {
    ctx.fillStyle = (Math.floor(x / 46) % 2 === 0) ? '#6b4a38' : '#5a3d2e';
    ctx.fillRect(x, 168, 44, 34);
    ctx.fillStyle = 'rgba(255,220,170,0.08)';
    ctx.fillRect(x, 168, 44, 3);
  }

  // (The ticket rail owns the strip below the top bar, so no window is drawn
  // here — an earlier draft covered the fourth ticket slot.)

  // string lights along the top
  ctx.strokeStyle = 'rgba(255,200,120,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.quadraticCurveTo(W / 2, 52, W, 22);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const lx = 40 + i * 88;
    const ly = 22 + Math.sin((lx / W) * Math.PI) * 24;
    const glow = 0.7 + Math.sin(t * 2 + i) * 0.3;
    ctx.fillStyle = `rgba(255,205,110,${glow})`;
    ctx.beginPath();
    ctx.arc(lx, ly + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // wooden floor at the bottom
  ctx.fillStyle = '#241811';
  ctx.fillRect(0, 700, W, 20);
  ctx.fillStyle = 'rgba(255,190,120,0.12)';
  ctx.fillRect(0, 700, W, 2);

  // counter top band under the kitchen zone
  const counter = ctx.createLinearGradient(0, 620, 0, 700);
  counter.addColorStop(0, '#7a5232');
  counter.addColorStop(1, '#5d3c22');
  ctx.fillStyle = counter;
  ctx.fillRect(0, 624, W, 8);
}

// ---------------------------------------------------------------- top bar

function drawTopBar(ctx, state, layout) {
  ctx.fillStyle = 'rgba(20,12,8,0.55)';
  ctx.fillRect(0, 0, W, 56);
  text(ctx, 'EMBER & ORDER', 16, 20, 22, '#ffcf8a');
  text(ctx, '深夜小馆 · 主厨', 16, 42, 12, '#c9a37a', 'normal');

  const def = levelDef(state.level);
  text(ctx, def.name, 330, 20, 17, '#fff2dd');
  text(ctx, def.en, 330, 42, 11, '#c9a37a', 'normal');

  // level clock
  const cx = 560;
  const clockW = 220;
  const ratio = Math.max(0, state.levelTimeLeft / def.duration);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  rr(ctx, cx, 18, clockW, 16, 8);
  ctx.fill();
  ctx.fillStyle = ratio < 0.25 ? '#e5484d' : '#ffcf8a';
  rr(ctx, cx, 18, clockW * ratio, 16, 8);
  ctx.fill();
  const mm = Math.floor(state.levelTimeLeft / 60);
  const ss = Math.floor(state.levelTimeLeft % 60).toString().padStart(2, '0');
  text(ctx, `${mm}:${ss}`, cx + clockW + 10, 26, 16, '#fff2dd');

  // quota
  text(ctx, `已出 ${state.board.servedThisLevel}/${def.quota} 单`, 560, 48, 13, '#ffd9a0');
  if (state.rush) {
    text(ctx, '🔥 RUSH · 出餐高峰', 845, 20, 14, '#ffb347');
  }

  // score + combo
  text(ctx, `¥ ${state.score.total}`, 1130, 20, 22, '#ffe9b8', 'bold', 'right');
  text(ctx, state.score.combo >= 2 ? `连击 x${state.score.combo}` : '连击 —', 1130, 42, 12, state.score.combo >= 2 ? '#ffb347' : '#c9a37a', 'normal', 'right');

  // pause / mute buttons
  for (const [rect, label] of [[layout.pauseButton, state.paused ? '▶' : '❚❚'], [layout.muteButton, state.muted ? '🔇' : '🔊']]) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 16, '#fff2dd', 'bold', 'center');
  }
}

// ---------------------------------------------------------------- tickets

function drawTickets(ctx, state, layout, t) {
  ctx.fillStyle = '#ffcf8a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  // tickets
  for (let i = 0; i < layout.tickets.length; i++) {
    const rect = layout.tickets[i];
    const order = state.board.orders[i];
    if (!order) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, '等单中…', rect.x + rect.w / 2, rect.y + rect.h / 2, 13, 'rgba(255,255,255,0.35)', 'normal', 'center');
      continue;
    }
    const urgency = orderUrgency(order);
    const isExpired = order.state === 'expired';
    const isServed = order.state === 'served';
    const paper = isExpired ? '#5a4a42' : isServed ? '#4a5a42' : '#fff6e3';
    const wobble = isServed || isExpired ? 0 : (urgency === 'critical' ? Math.sin(t * 10) * 1.5 : 0);
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(wobble * 0.01);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, 3, 5, rect.w, rect.h, 10);
    ctx.fill();
    ctx.fillStyle = paper;
    rr(ctx, 0, 0, rect.w, rect.h, 10);
    ctx.fill();
    // clip pin
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(rect.w / 2, 4, 6, 0, Math.PI * 2);
    ctx.fill();
    if (isExpired) {
      text(ctx, '客人走了…', 14, 30, 18, '#e8d8c8');
      text(ctx, '-¥50 · 连击中断', 14, 56, 13, '#d8b8a8', 'normal');
    } else if (isServed) {
      text(ctx, '✓ 已出菜', 14, 30, 18, '#7dc24a');
      text(ctx, order.dishName, 14, 56, 13, '#7a8a6a', 'normal');
    } else {
      text(ctx, `#${order.id} ${order.dishName}`, 14, 22, 17, '#3a2a1a');
      text(ctx, order.dishEn, 14, 42, 11, '#8a7a66', 'normal');
      // item chips with check marks for items already plated
      const platedCounts = {};
      for (const plate of state.plates) {
        for (const item of plate.items) platedCounts[item] = (platedCounts[item] ?? 0) + 1;
      }
      const needCounts = {};
      for (const item of order.items) needCounts[item] = (needCounts[item] ?? 0) + 1;
      order.items.forEach((item, idx) => {
        const cx = 30 + idx * 44;
        drawIngredientChip(ctx, item, cx, 66, 17);
        if ((platedCounts[item] ?? 0) >= needCounts[item]) {
          ctx.fillStyle = '#4a8a26';
          ctx.beginPath();
          ctx.arc(cx + 12, 52, 8, 0, Math.PI * 2);
          ctx.fill();
          text(ctx, '✓', cx + 12, 53, 11, '#fff', 'bold', 'center');
        }
      });
      text(ctx, `¥${order.price}`, rect.w - 14, 22, 16, '#b97f2e', 'bold', 'right');
      // patience bar
      const ratio = order.timeLeft / order.timeMax;
      const barColor = ratio < 0.2 ? '#e5484d' : ratio < 0.45 ? '#e8a33c' : '#7dc24a';
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      rr(ctx, 14, 84, rect.w - 28, 8, 4);
      ctx.fill();
      ctx.fillStyle = barColor;
      rr(ctx, 14, 84, (rect.w - 28) * ratio, 8, 4);
      ctx.fill();
      text(ctx, `${Math.ceil(order.timeLeft)}s`, rect.w - 14, 68, 12, urgency === 'critical' ? '#e5484d' : '#8a7a66', 'bold', 'right');
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- pantry

function drawPantry(ctx, state, layout) {
  const p = layout.pantry;
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  text(ctx, '食材台 PANTRY', p.x + 14, p.y + 18, 14, '#ffcf8a');
  text(ctx, '点一下拿食材 · 数字键 1-9', p.x + p.w - 14, p.y + 18, 11, '#c9a37a', 'normal', 'right');

  for (const bin of layout.bins) {
    const ing = INGREDIENTS[bin.id];
    const hover = state.mouse.x >= bin.x && state.mouse.x <= bin.x + bin.w && state.mouse.y >= bin.y && state.mouse.y <= bin.y + bin.h;
    const held = state.hand === bin.id;
    ctx.fillStyle = hover ? '#6b4a38' : '#54382a';
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 10);
    ctx.fill();
    ctx.strokeStyle = held ? '#ffcf8a' : 'rgba(255,220,170,0.25)';
    ctx.lineWidth = held ? 2.5 : 1.5;
    ctx.stroke();
    drawIngredient(ctx, bin.id, bin.x + bin.w / 2, bin.y + 38, 26);
    text(ctx, ing.name, bin.x + bin.w / 2, bin.y + 74, 14, '#fff2dd', 'bold', 'center');
    const stationHint = ing.station === 'board' ? '砧板切' : ing.station === 'grill' ? '煎锅煎' : ing.station === 'pot' ? '汤锅煮' : '直接装盘';
    text(ctx, stationHint, bin.x + bin.w / 2, bin.y + 92, 10, '#c9a37a', 'normal', 'center');
    // key badge
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(bin.x + 12, bin.y + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, bin.key, bin.x + 12, bin.y + 12, 11, '#ffe9b8', 'bold', 'center');
  }
}

// ---------------------------------------------------------------- stations

function drawStations(ctx, state, layout, t) {
  for (const rect of layout.stations) {
    const st = state.stations.find((s) => s.kind === rect.kind);
    const glow = st.state === 'done';
    ctx.fillStyle = 'rgba(20,12,8,0.45)';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    if (glow) {
      ctx.strokeStyle = `rgba(125,194,74,${0.6 + Math.sin(t * 6) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (st.state === 'burnt') {
      ctx.strokeStyle = 'rgba(229,72,77,0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    text(ctx, st.def.name, rect.x + rect.w / 2, rect.y + 20, 15, '#ffcf8a', 'bold', 'center');
    text(ctx, st.def.en, rect.x + rect.w / 2, rect.y + 38, 10, '#c9a37a', 'normal', 'center');

    const cx = rect.x + rect.w / 2;
    const cy = rect.y + 118;
    if (st.kind === 'board') {
      ctx.fillStyle = '#c98f4e';
      rr(ctx, cx - 62, cy - 34, 124, 68, 8);
      ctx.fill();
      ctx.fillStyle = '#a97a3e';
      rr(ctx, cx - 62, cy - 34, 124, 10, 8);
      ctx.fill();
      // knife
      ctx.save();
      ctx.translate(cx + 38, cy - 44);
      ctx.rotate(0.5);
      ctx.fillStyle = '#d8d8de';
      rr(ctx, 0, -4, 34, 8, 3);
      ctx.fill();
      ctx.fillStyle = '#3a2a1a';
      rr(ctx, -14, -3, 14, 6, 3);
      ctx.fill();
      ctx.restore();
    } else if (st.kind === 'grill') {
      ctx.fillStyle = '#2e2e34';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 62, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#454550';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 54, 33, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1c20';
      rr(ctx, cx + 52, cy - 4, 34, 10, 5);
      ctx.fill();
    } else {
      // pot
      ctx.fillStyle = '#7a6a8a';
      rr(ctx, cx - 58, cy - 30, 116, 62, 10);
      ctx.fill();
      ctx.fillStyle = '#5d4f6e';
      rr(ctx, cx - 62, cy - 38, 124, 14, 7);
      ctx.fill();
      ctx.fillStyle = st.state === 'working' ? '#7fb3d8' : '#5d8aa8';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 30, 52, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      if (st.state === 'working') {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 3; i++) {
          const bx = cx - 26 + i * 26 + Math.sin(t * 5 + i * 2) * 3;
          ctx.beginPath();
          ctx.arc(bx, cy - 32 - (Math.sin(t * 6 + i) * 2), 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (st.item) {
      drawIngredient(ctx, st.item, cx, cy, 24);
    } else if (st.state === 'empty') {
      text(ctx, '空', cx, cy, 20, 'rgba(255,255,255,0.25)', 'bold', 'center');
    }
    if (st.state === 'burnt') {
      drawIngredient(ctx, 'burnt', cx, cy, 24);
    }

    // progress bar
    const barY = rect.y + 168;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    rr(ctx, rect.x + 14, barY, rect.w - 28, 12, 6);
    ctx.fill();
    if (st.state === 'working') {
      ctx.fillStyle = st.def.color === '#c98f4e' ? '#e8b25c' : '#ff9a3c';
      rr(ctx, rect.x + 14, barY, (rect.w - 28) * st.progress, 12, 6);
      ctx.fill();
    } else if (st.state === 'done') {
      ctx.fillStyle = '#7dc24a';
      rr(ctx, rect.x + 14, barY, rect.w - 28, 12, 6);
      ctx.fill();
    } else if (st.state === 'burnt') {
      ctx.fillStyle = '#e5484d';
      rr(ctx, rect.x + 14, barY, rect.w - 28, 12, 6);
      ctx.fill();
    }
    const statusColor = st.state === 'done' ? '#9be15d' : st.state === 'burnt' ? '#ff8a80' : '#e8d8c8';
    text(ctx, stationStatusText(st), rect.x + rect.w / 2, barY + 26, 13, statusColor, 'bold', 'center');
  }
}

// ---------------------------------------------------------------- serve window / plates / trash / recipe book

function drawServeWindow(ctx, state, layout, t) {
  const w = layout.serveWindow;
  const anyReady = state.plates.some((plate) => {
    const recipe = plateMatchesRecipe(plate, RECIPE_LIST);
    return recipe && state.board.orders.some((o) => o.state === 'active' && o.dishId === recipe.id);
  });
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  rr(ctx, w.x, w.y, w.w, w.h, 12);
  ctx.fill();
  if (anyReady) {
    ctx.strokeStyle = `rgba(255,207,138,${0.6 + Math.sin(t * 6) * 0.35})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // service window frame
  ctx.fillStyle = '#2c1e17';
  rr(ctx, w.x + 16, w.y + 44, w.w - 32, 120, 8);
  ctx.fill();
  ctx.fillStyle = '#ffcf8a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('出 菜 口 · THE PASS', w.x + w.w / 2, w.y + 24);
  // bell
  const bx = w.x + w.w / 2;
  const by = w.y + 104;
  ctx.fillStyle = '#e8b25c';
  ctx.beginPath();
  ctx.arc(bx, by, 34, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c98f4e';
  rr(ctx, bx - 38, by, 76, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#8a6a48';
  ctx.beginPath();
  ctx.arc(bx, by - 34, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = anyReady ? '#7dc24a' : '#e8d8c8';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(anyReady ? '有菜能出！点盘子上菜' : '把做好的菜放上盘子', bx, w.y + 184);
  ctx.font = 'normal 11px system-ui, sans-serif';
  ctx.fillStyle = '#c9a37a';
  ctx.fillText('盘子凑齐一道菜就自动亮起，可直接点盘子出菜', bx, w.y + 206);
}

function drawPlates(ctx, state, layout, t) {
  for (let i = 0; i < layout.plates.length; i++) {
    const p = layout.plates[i];
    const plate = state.plates[i];
    const recipe = plateMatchesRecipe(plate, RECIPE_LIST);
    const canServe = recipe && state.board.orders.some((o) => o.state === 'active' && o.dishId === recipe.id);
    // shadow + plate
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 8, p.r + 6, p.r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    if (canServe) {
      const glow = 0.5 + Math.sin(t * 6) * 0.3;
      ctx.strokeStyle = `rgba(255,207,138,${glow})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    const plateGrad = ctx.createRadialGradient(p.x - 20, p.y - 24, 10, p.x, p.y, p.r);
    plateGrad.addColorStop(0, '#ffffff');
    plateGrad.addColorStop(1, '#ddd5c8');
    ctx.fillStyle = plateGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8ac96';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r - 12, 0, Math.PI * 2);
    ctx.stroke();

    // items arranged on the plate
    const offsets = [[0, -18], [-26, 12], [26, 12], [0, 26]];
    plate.items.forEach((item, idx) => {
      const [ox, oy] = offsets[idx % offsets.length];
      drawIngredient(ctx, item, p.x + ox, p.y + oy, 26);
    });
    if (plate.items.length === 0) {
      text(ctx, '空盘子', p.x, p.y, 15, '#b8ac96', 'normal', 'center');
    }

    const labelY = p.y + p.r + 18;
    if (recipe) {
      text(ctx, canServe ? `${recipe.name} · 点我出菜！` : `${recipe.name} · 暂无此单`, p.x, labelY, 14, canServe ? '#9be15d' : '#e8d8c8', 'bold', 'center');
    } else if (plate.items.length > 0) {
      text(ctx, `组装中 ${plate.items.length}/4`, p.x, labelY, 14, '#ffd9a0', 'bold', 'center');
    } else {
      text(ctx, `盘子 ${i + 1}`, p.x, labelY, 13, '#c9a37a', 'normal', 'center');
    }
  }
}

function drawTrashAndBook(ctx, state, layout) {
  const tr = layout.trash;
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 12);
  ctx.fill();
  text(ctx, '垃圾桶', tr.x + tr.w / 2, tr.y + 22, 14, '#ffcf8a', 'bold', 'center');
  // bin
  ctx.fillStyle = '#5a5a62';
  rr(ctx, tr.x + 46, tr.y + 44, 60, 84, 8);
  ctx.fill();
  ctx.fillStyle = '#45454c';
  rr(ctx, tr.x + 40, tr.y + 36, 72, 12, 6);
  ctx.fill();
  ctx.strokeStyle = '#33333a';
  ctx.lineWidth = 3;
  for (const lx of [tr.x + 62, tr.x + 76, tr.x + 90]) {
    ctx.beginPath();
    ctx.moveTo(lx, tr.y + 56);
    ctx.lineTo(lx, tr.y + 116);
    ctx.stroke();
  }
  text(ctx, '手里拿着的东西', tr.x + tr.w / 2, tr.y + 152, 12, '#e8d8c8', 'normal', 'center');
  text(ctx, '点这里丢掉', tr.x + tr.w / 2, tr.y + 172, 12, '#e8d8c8', 'normal', 'center');

  const book = layout.recipeBook;
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  rr(ctx, book.x, book.y, book.w, book.h, 12);
  ctx.fill();
  text(ctx, '菜谱 · 今晚的菜单', book.x + 14, book.y + 20, 14, '#ffcf8a');
  const recipes = RECIPE_LIST.filter((r) => r.unlockLevel <= state.level);
  recipes.forEach((r, idx) => {
    const y = book.y + 48 + idx * 26;
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(book.x + 22, y, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `${r.name}  ¥${r.price}`, book.x + 34, y, 13, '#fff2dd');
    r.items.forEach((item, j) => {
      drawIngredientChip(ctx, item, book.x + 150 + j * 26, y, 11);
    });
  });
}

// ---------------------------------------------------------------- bottom bar + hand

function drawBottomBar(ctx, state, layout) {
  const b = layout.bottomBar;
  ctx.fillStyle = 'rgba(20,12,8,0.55)';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  // hand slot
  text(ctx, '手里', 24, b.y + 20, 12, '#c9a37a', 'normal');
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, 24, b.y + 32, 120, 44, 8);
  ctx.fill();
  if (state.hand) {
    const ing = INGREDIENTS[state.hand];
    drawIngredient(ctx, state.hand, 52, b.y + 54, 18);
    text(ctx, ing.name, 80, b.y + 54, 14, '#fff2dd');
  } else {
    text(ctx, '空手', 84, b.y + 54, 13, '#c9a37a', 'normal', 'center');
  }
  text(ctx, '点食材拿起 → 点砧板/煎锅/汤锅加工 → 点盘子装盘 → 凑齐点盘子出菜', 640, b.y + 30, 14, '#e8d8c8', 'normal', 'center');
  text(ctx, '快捷键：1-9 拿食材 · T 扔掉手里东西 · P 暂停 · M 静音', 640, b.y + 58, 12, '#c9a37a', 'normal', 'center');
}

// ---------------------------------------------------------------- particles / floaters

export function spawnSteam(state, x, y) {
  state.particles.push({ type: 'steam', x, y, vx: (Math.random() - 0.5) * 8, vy: -22 - Math.random() * 14, life: 0, maxLife: 1.1, size: 5 + Math.random() * 5 });
}

export function spawnSparkle(state, x, y) {
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 90;
    state.particles.push({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0, maxLife: 0.7 + Math.random() * 0.4, size: 3 + Math.random() * 4, color: ['#ffcf8a', '#ffd94d', '#fff6d8'][i % 3] });
  }
}

export function spawnFloater(state, x, y, str, color = '#ffe9b8', size = 20) {
  state.floaters.push({ x, y, text: str, life: 0, maxLife: 1.6, color, size });
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = 1 - p.life / p.maxLife;
    if (p.type === 'steam') {
      ctx.fillStyle = `rgba(230,230,230,${a * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + p.life), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  for (const f of state.floaters) {
    const a = 1 - f.life / f.maxLife;
    ctx.globalAlpha = Math.min(1, a * 1.5);
    text(ctx, f.text, f.x, f.y - f.life * 34, f.size, f.color, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
}

function tickParticles(state, dt) {
  for (const p of state.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.type === 'spark' ? 160 * dt : -6 * dt;
  }
  state.particles = state.particles.filter((p) => p.life < p.maxLife);
  for (const f of state.floaters) f.life += dt;
  state.floaters = state.floaters.filter((f) => f.life < f.maxLife);
}

// ---------------------------------------------------------------- overlays

function dim(ctx) {
  ctx.fillStyle = 'rgba(16,8,4,0.72)';
  ctx.fillRect(0, 0, W, H);
}

function drawButton(ctx, rect, label, sub = null) {
  ctx.fillStyle = '#e8a34c';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, rect.x, rect.y + rect.h - 8, rect.w, 8, 6);
  ctx.fill();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 - (sub ? 8 : 0), 22, '#2c1a08', 'bold', 'center');
  if (sub) text(ctx, sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 18, 12, '#5c3a10', 'normal', 'center');
}

function drawStars(ctx, cx, y, stars, size = 26) {
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * (size * 2 + 8);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = i < stars ? '#ffd94d' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
      const r = k % 2 === 0 ? size : size * 0.45;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawTitle(ctx, state, layout) {
  dim(ctx);
  text(ctx, 'EMBER & ORDER', 640, 150, 64, '#ffcf8a', 'bold', 'center');
  text(ctx, '深 夜 小 馆 主 厨', 640, 210, 30, '#fff2dd', 'bold', 'center');
  text(ctx, '午夜十二点，小馆亮起灯。订单一张接一张——切菜、煎制、煮面、装盘，', 640, 268, 16, '#e8d8c8', 'normal', 'center');
  text(ctx, '在客人等得不耐烦之前，把热腾腾的菜端上桌。', 640, 294, 16, '#e8d8c8', 'normal', 'center');
  // how to play
  const steps = [
    ['① 拿食材', '点食材台，或按 1-9'],
    ['② 加工', '砧板切 · 煎锅煎 · 汤锅煮'],
    ['③ 装盘出菜', '凑齐菜谱点盘子出菜'],
  ];
  steps.forEach(([a, b], i) => {
    const x = 340 + i * 200;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    rr(ctx, x, 330, 180, 84, 10);
    ctx.fill();
    text(ctx, a, x + 90, 356, 16, '#ffcf8a', 'bold', 'center');
    text(ctx, b, x + 90, 384, 12, '#e8d8c8', 'normal', 'center');
  });
  drawButton(ctx, layout.startButton, '开始营业', '第一夜 · 5 单');
  text(ctx, '鼠标 + 键盘游玩 · 声音由 WebAudio 合成', 640, 612, 12, '#c9a37a', 'normal', 'center');
}

function drawLevelComplete(ctx, state, layout) {
  dim(ctx);
  const def = levelDef(state.level);
  text(ctx, `${def.name} · 打烊了！`, 640, 170, 40, '#ffcf8a', 'bold', 'center');
  drawStars(ctx, 640, 250, state.lastStars);
  text(ctx, `本夜收入 ¥${state.score.earnedThisLevel}   ·   累计 ¥${state.score.total}`, 640, 320, 20, '#fff2dd', 'bold', 'center');
  text(ctx, `出菜 ${state.score.served} 单 · 最佳连击 x${state.score.bestCombo} · 烧焦 ${state.score.burnt} 次`, 640, 356, 15, '#e8d8c8', 'normal', 'center');
  const next = state.level < 3 ? `下一夜 · ${levelDef(state.level + 1).name}` : '再来一夜';
  drawButton(ctx, layout.nextButton, state.level < 3 ? '继续营业' : '通关！再来一夜', next);
}

function drawGameOver(ctx, state, layout) {
  dim(ctx);
  text(ctx, '打烊了……', 640, 170, 44, '#ff8a80', 'bold', 'center');
  text(ctx, state.gameOverReason ?? '时间到，今晚的单没出完。', 640, 226, 18, '#e8d8c8', 'normal', 'center');
  text(ctx, `本局收入 ¥${state.score.total} · 出菜 ${state.score.served} 单`, 640, 280, 18, '#fff2dd', 'bold', 'center');
  drawButton(ctx, layout.retryButton, '再来一夜', '重新开始第一夜');
}

function drawWin(ctx, state, layout) {
  dim(ctx);
  text(ctx, '三夜全满贯！', 640, 150, 48, '#ffd94d', 'bold', 'center');
  drawStars(ctx, 640, 230, state.lastStars);
  text(ctx, '小馆的灯亮了三夜，客人都吃饱了。', 640, 300, 18, '#e8d8c8', 'normal', 'center');
  text(ctx, `总收入 ¥${state.score.total} · 出菜 ${state.score.served} 单 · 最佳连击 x${state.score.bestCombo}`, 640, 340, 18, '#fff2dd', 'bold', 'center');
  drawButton(ctx, layout.retryButton, '再开一局', '从第一夜重新开始');
}

// ---------------------------------------------------------------- main draw

export function drawGame(ctx, state, layout, dt) {
  const t = state.elapsed;
  if (state.screen === 'playing' || state.screen === 'paused') {
    tickParticles(state, dt);
  }
  drawBackground(ctx, state, t);
  drawTopBar(ctx, state, layout);
  drawTickets(ctx, state, layout, t);
  drawPantry(ctx, state, layout);
  drawStations(ctx, state, layout, t);
  drawServeWindow(ctx, state, layout, t);
  drawPlates(ctx, state, layout, t);
  drawTrashAndBook(ctx, state, layout);
  drawBottomBar(ctx, state, layout);

  // steam from working grill / pot
  if (state.screen === 'playing' && !state.paused) {
    for (const rect of layout.stations) {
      const st = state.stations.find((s) => s.kind === rect.kind);
      if (st.state === 'working' && Math.random() < 0.35) {
        spawnSteam(state, rect.x + rect.w / 2 + (Math.random() - 0.5) * 60, rect.y + 84);
      }
      if (st.state === 'burnt' && Math.random() < 0.3) {
        state.particles.push({ type: 'steam', x: rect.x + rect.w / 2, y: rect.y + 80, vx: 0, vy: -30, life: 0, maxLife: 0.9, size: 8 });
      }
    }
  }
  drawParticles(ctx, state);

  // hand item follows the cursor
  if (state.hand && state.screen === 'playing') {
    drawIngredientChip(ctx, state.hand, state.mouse.x, state.mouse.y - 30, 20);
  }

  if (state.screen === 'title') drawTitle(ctx, state, layout);
  else if (state.screen === 'levelComplete') drawLevelComplete(ctx, state, layout);
  else if (state.screen === 'gameOver') drawGameOver(ctx, state, layout);
  else if (state.screen === 'win') drawWin(ctx, state, layout);
  else if (state.screen === 'paused') {
    dim(ctx);
    text(ctx, '暂停中', 640, 320, 44, '#fff2dd', 'bold', 'center');
    text(ctx, '按 P 或点右上角继续', 640, 372, 16, '#e8d8c8', 'normal', 'center');
  }
}
