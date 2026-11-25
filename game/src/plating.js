// plating.js — the plates on the pass: assemble a dish, check it, serve it.
// A plate holds up to 4 items. Clicking a plate with an item in hand adds it
// (only when the dish still needs it). Clicking a plate that exactly matches a
// pending order serves it at once. Clicking a plate with an empty hand takes
// the last item back off.

import { RECIPE_LIST } from './recipes.js';

export function createPlate() {
  return { items: [], flash: 0 }; // flash: seconds of serve-glow left
}

export function createPlates() {
  return [createPlate(), createPlate()];
}

export function plateIsEmpty(plate) {
  return plate.items.length === 0;
}

export function plateIsFull(plate) {
  return plate.items.length >= 4;
}

// Would this item help finish some pending order on this plate?
// An item is welcome when some order's recipe still needs it after the plate's items.
export function plateWants(plate, ingredientId, orders) {
  if (plateIsFull(plate)) return false;
  const wanted = new Set();
  for (const order of orders) {
    if (order.state !== 'active') continue;
    const remaining = [...order.items];
    for (const held of plate.items) {
      const i = remaining.indexOf(held);
      if (i >= 0) remaining.splice(i, 1);
    }
    for (const r of remaining) wanted.add(r);
  }
  return wanted.has(ingredientId);
}

export function addToPlate(plate, ingredientId) {
  if (plateIsFull(plate)) return false;
  plate.items.push(ingredientId);
  return true;
}

export function takeFromPlate(plate) {
  return plate.items.pop() ?? null;
}

export function clearPlate(plate) {
  plate.items = [];
}

// Match the plate against every recipe by exact contents.
export function plateMatchesRecipe(plate, recipes) {
  const sorted = [...plate.items].sort().join('|');
  return recipes.find((r) => [...r.items].sort().join('|') === sorted) ?? null;
}
