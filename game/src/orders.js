// orders.js — the ticket rail: spawning orders, their countdowns and expiry.
// An order is a dish a customer wants, with a patience timer. Serve the exact
// dish before the timer runs out. Expiry costs score and breaks the combo.

import { levelDef, levelRecipes, spawnIntervalFor } from './levels.js';
import { recipeById } from './recipes.js';

let nextOrderId = 1;

export function createOrder(level, timeLeft) {
  const def = levelDef(level);
  const pool = levelRecipes(level);
  const recipe = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: nextOrderId++,
    dishId: recipe.id,
    dishName: recipe.name,
    dishEn: recipe.en,
    items: [...recipe.items],
    price: recipe.price,
    color: recipe.color,
    timeLeft: def.orderTime,
    timeMax: def.orderTime,
    state: 'active', // active | served | expired
  };
}

export function createOrderBoard(level) {
  return {
    level,
    orders: [],
    spawnTimer: 2.5, // first ticket arrives quickly so the game starts moving
    servedThisLevel: 0,
  };
}

// Tick the board: spawn new tickets on schedule, count every ticket down.
// Returns { expired: Order[] } so the caller can score the misses.
export function tickOrderBoard(board, dt, timeLeft) {
  const expired = [];
  const def = levelDef(board.level);

  board.spawnTimer -= dt;
  if (board.spawnTimer <= 0) {
    const active = board.orders.filter((o) => o.state === 'active');
    if (active.length < def.maxOrders) {
      board.orders.push(createOrder(board.level, timeLeft));
    }
    board.spawnTimer = spawnIntervalFor(board.level, timeLeft);
  }

  for (const order of board.orders) {
    if (order.state !== 'active') continue;
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      order.timeLeft = 0;
      order.state = 'expired';
      expired.push(order);
    }
  }
  // Keep finished tickets on the rail briefly so the player sees what happened,
  // then drop them. Served/expired tickets fade out in the renderer.
  board.orders = board.orders.filter((o) => o.state === 'active' || o.age === undefined);
  for (const order of board.orders) {
    if (order.state !== 'active') order.age = (order.age ?? 0) + dt;
  }
  board.orders = board.orders.filter((o) => o.state === 'active' || (o.age ?? 0) < 1.2);
  return { expired };
}

export function activeOrders(board) {
  return board.orders.filter((o) => o.state === 'active');
}

// Find the first active order whose dish matches the plate exactly.
export function findMatchingOrder(board, plateItems) {
  const sorted = [...plateItems].sort().join('|');
  return board.orders.find((o) => o.state === 'active' && [...o.items].sort().join('|') === sorted) ?? null;
}

export function orderUrgency(order) {
  const ratio = order.timeLeft / order.timeMax;
  if (ratio < 0.2) return 'critical';
  if (ratio < 0.45) return 'hurry';
  return 'calm';
}

export function dishOf(order) {
  return recipeById(order.dishId);
}
