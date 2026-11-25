// recipes.js — every dish and ingredient in Ember & Order.
// Data only: names, what a dish needs, and how each raw ingredient is processed.
// No game logic here; the state machines live in cooking-stations.js and plating.js.

export const INGREDIENTS = {
  bun:      { id: 'bun',      name: '面包',   en: 'Bun',      color: '#e8b25c', dark: '#b97f2e', station: null,    time: 0,   result: 'bun' },
  patty:    { id: 'patty',    name: '肉饼',   en: 'Patty',    color: '#a85b3a', dark: '#6e3520', station: 'grill', time: 4.5, result: 'patty_grilled' },
  lettuce:  { id: 'lettuce',  name: '生菜',   en: 'Lettuce',  color: '#7dc24a', dark: '#4a8a26', station: 'board', time: 2.5, result: 'lettuce_chopped' },
  tomato:   { id: 'tomato',   name: '番茄',   en: 'Tomato',   color: '#e5484d', dark: '#a52a2e', station: 'board', time: 2.5, result: 'tomato_chopped' },
  cheese:   { id: 'cheese',   name: '芝士',   en: 'Cheese',   color: '#f7c948', dark: '#c8931a', station: 'board', time: 2.5, result: 'cheese_sliced' },
  noodles:  { id: 'noodles',  name: '面条',   en: 'Noodles',  color: '#f2d06b', dark: '#c79a2e', station: 'pot',   time: 5.5, result: 'noodles_boiled' },
  rice:     { id: 'rice',     name: '米饭',   en: 'Rice',     color: '#f5f0e1', dark: '#cfc4a4', station: 'pot',   time: 5.5, result: 'rice_boiled' },
  fish:     { id: 'fish',     name: '鱼片',   en: 'Fish',     color: '#f2a0a8', dark: '#c96a74', station: 'board', time: 2.5, result: 'fish_chopped' },
  seaweed:  { id: 'seaweed',  name: '海苔',   en: 'Seaweed',  color: '#2e5d3a', dark: '#17351f', station: null,    time: 0,   result: 'seaweed' },
  // Processed results (what comes off a station, or what a raw ready-to-use item is).
  patty_grilled:   { id: 'patty_grilled',   name: '煎肉饼', en: 'Grilled Patty', color: '#8a4a28', dark: '#5c2f16', station: null, time: 0, result: 'patty_grilled' },
  lettuce_chopped: { id: 'lettuce_chopped', name: '切好生菜', en: 'Chopped Lettuce', color: '#8fd45e', dark: '#4a8a26', station: null, time: 0, result: 'lettuce_chopped' },
  tomato_chopped:  { id: 'tomato_chopped',  name: '切好番茄', en: 'Chopped Tomato', color: '#f2605e', dark: '#a52a2e', station: null, time: 0, result: 'tomato_chopped' },
  cheese_sliced:   { id: 'cheese_sliced',   name: '芝士片', en: 'Cheese Slice', color: '#ffd94d', dark: '#c8931a', station: null, time: 0, result: 'cheese_sliced' },
  noodles_boiled:  { id: 'noodles_boiled',  name: '煮好面条', en: 'Boiled Noodles', color: '#ffe08a', dark: '#c79a2e', station: null, time: 0, result: 'noodles_boiled' },
  rice_boiled:     { id: 'rice_boiled',     name: '煮好米饭', en: 'Cooked Rice', color: '#fffaf0', dark: '#cfc4a4', station: null, time: 0, result: 'rice_boiled' },
  fish_chopped:    { id: 'fish_chopped',    name: '切好鱼片', en: 'Sliced Fish', color: '#ffb3ba', dark: '#c96a74', station: null, time: 0, result: 'fish_chopped' },
  burnt:           { id: 'burnt',           name: '烧焦了', en: 'Burnt', color: '#3a2a22', dark: '#1c130e', station: null, time: 0, result: 'burnt' },
};

export const PANTRY_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'noodles', 'rice', 'fish', 'seaweed'];

// station: 'board' | 'grill' | 'pot' | null (null = ready to plate as-is)
export function stationFor(ingredientId) {
  const ing = INGREDIENTS[ingredientId];
  return ing ? ing.station : null;
}

export function processResult(ingredientId) {
  const ing = INGREDIENTS[ingredientId];
  return ing ? ing.result : ingredientId;
}

export function processTime(ingredientId) {
  const ing = INGREDIENTS[ingredientId];
  return ing ? ing.time : 0;
}

export const RECIPES = {
  burger: {
    id: 'burger', name: '招牌汉堡', en: 'Signature Burger',
    items: ['bun', 'patty_grilled', 'lettuce_chopped', 'tomato_chopped'],
    price: 120, color: '#e8a34c', unlockLevel: 1,
  },
  pasta: {
    id: 'pasta', name: '番茄意面', en: 'Tomato Pasta',
    items: ['noodles_boiled', 'tomato_chopped', 'cheese_sliced'],
    price: 110, color: '#e5643f', unlockLevel: 1,
  },
  salad: {
    id: 'salad', name: '田园沙拉', en: 'Garden Salad',
    items: ['lettuce_chopped', 'tomato_chopped', 'cheese_sliced'],
    price: 90, color: '#7dc24a', unlockLevel: 1,
  },
  sushi: {
    id: 'sushi', name: '深夜寿司', en: 'Midnight Sushi',
    items: ['rice_boiled', 'fish_chopped', 'seaweed'],
    price: 150, color: '#f2a0a8', unlockLevel: 2,
  },
  sandwich: {
    id: 'sandwich', name: '芝士三明治', en: 'Cheese Sandwich',
    items: ['bun', 'cheese_sliced', 'lettuce_chopped', 'tomato_chopped'],
    price: 100, color: '#f7c948', unlockLevel: 2,
  },
  ramen: {
    id: 'ramen', name: '深夜拉面', en: 'Midnight Ramen',
    items: ['noodles_boiled', 'fish_chopped', 'seaweed'],
    price: 160, color: '#f2d06b', unlockLevel: 3,
  },
};

export const RECIPE_LIST = Object.values(RECIPES);

export function recipesForLevel(level) {
  return RECIPE_LIST.filter((r) => r.unlockLevel <= level);
}

export function recipeById(id) {
  return RECIPES[id] ?? null;
}
