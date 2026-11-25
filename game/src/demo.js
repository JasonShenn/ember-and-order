// demo.js — frozen showcase states for screenshots, driven by ?demo=.
// These are the same game objects the live game uses, just pre-filled and
// paused, so every screenshot is a real render of real game state:
//   cover   — level 2 mid-service: tickets, a dish half-built, stations working
//   cooking — grill and pot busy, board done, hand holding a tomato
//   serving — a finished burger on the plate, matching ticket glowing
//   rush    — rush hour: three urgent tickets, combo x5, clock nearly out

import { createOrderBoard } from './orders.js';
import { createStations, placeOnStation } from './cooking-stations.js';
import { createPlates, addToPlate } from './plating.js';
import { createScore } from './scoring.js';
import { levelDef } from './levels.js';

function baseState(level) {
  const def = levelDef(level);
  return {
    screen: 'playing',
    level,
    levelTimeLeft: def.duration - 40,
    elapsed: 0,
    board: createOrderBoard(level),
    stations: createStations(),
    plates: createPlates(),
    hand: null,
    score: createScore(),
    rush: false,
    paused: false,
    frozen: true, // demo states never tick: the screenshot stays put
    muted: true,
    particles: [],
    floaters: [],
    mouse: { x: -100, y: -100 },
    stats: { served: 0, expired: 0 },
    lastStars: 0,
    gameOverReason: '',
  };
}

function seedTicket(state, dishId, timeLeft, timeMax) {
  const board = state.board;
  const order = {
    id: board.orders.length + 1,
    dishId,
    dishName: { burger: '招牌汉堡', pasta: '番茄意面', salad: '田园沙拉', sushi: '深夜寿司', sandwich: '芝士三明治', ramen: '深夜拉面' }[dishId],
    dishEn: { burger: 'Signature Burger', pasta: 'Tomato Pasta', salad: 'Garden Salad', sushi: 'Midnight Sushi', sandwich: 'Cheese Sandwich', ramen: 'Midnight Ramen' }[dishId],
    items: { burger: ['bun', 'patty_grilled', 'lettuce_chopped', 'tomato_chopped'], pasta: ['noodles_boiled', 'tomato_chopped', 'cheese_sliced'], salad: ['lettuce_chopped', 'tomato_chopped', 'cheese_sliced'], sushi: ['rice_boiled', 'fish_chopped', 'seaweed'], sandwich: ['bun', 'cheese_sliced', 'lettuce_chopped', 'tomato_chopped'], ramen: ['noodles_boiled', 'fish_chopped', 'seaweed'] }[dishId],
    price: { burger: 120, pasta: 110, salad: 90, sushi: 150, sandwich: 100, ramen: 160 }[dishId],
    color: '#e8a34c',
    timeLeft,
    timeMax,
    state: 'active',
  };
  board.orders.push(order);
  return order;
}

export function seedDemo(kind) {
  if (kind === 'cooking') {
    const s = baseState(1);
    s.levelTimeLeft = 118;
    seedTicket(s, 'burger', 52, 75);
    seedTicket(s, 'pasta', 38, 75);
    const [board, grill, pot] = s.stations;
    placeOnStation(board, 'lettuce');
    board.progress = 0.85;
    placeOnStation(grill, 'patty');
    grill.progress = 0.55;
    placeOnStation(pot, 'noodles');
    pot.progress = 0.35;
    s.hand = 'tomato';
    s.mouse = { x: 640, y: 460 };
    s.score.total = 340;
    s.score.combo = 2;
    s.score.served = 2;
    s.board.servedThisLevel = 2;
    return s;
  }

  if (kind === 'serving') {
    const s = baseState(2);
    s.levelTimeLeft = 96;
    seedTicket(s, 'burger', 44, 70);
    seedTicket(s, 'sushi', 60, 70);
    seedTicket(s, 'pasta', 22, 70);
    const plate = s.plates[0];
    addToPlate(plate, 'bun');
    addToPlate(plate, 'patty_grilled');
    addToPlate(plate, 'lettuce_chopped');
    addToPlate(plate, 'tomato_chopped');
    addToPlate(s.plates[1], 'rice_boiled');
    addToPlate(s.plates[1], 'fish_chopped');
    const [board, grill, pot] = s.stations;
    placeOnStation(board, 'tomato');
    board.state = 'done';
    board.progress = 1;
    placeOnStation(pot, 'rice');
    pot.progress = 0.6;
    s.score.total = 1180;
    s.score.combo = 4;
    s.score.served = 6;
    s.board.servedThisLevel = 6;
    return s;
  }

  if (kind === 'rush') {
    const s = baseState(3);
    s.levelTimeLeft = 38;
    s.rush = true;
    seedTicket(s, 'ramen', 18, 65);
    seedTicket(s, 'burger', 12, 65);
    seedTicket(s, 'sushi', 41, 65);
    seedTicket(s, 'pasta', 27, 65);
    const [board, grill, pot] = s.stations;
    placeOnStation(board, 'fish');
    board.progress = 0.5;
    placeOnStation(grill, 'patty');
    grill.progress = 0.8;
    placeOnStation(pot, 'noodles');
    pot.state = 'done';
    pot.progress = 1;
    addToPlate(s.plates[0], 'noodles_boiled');
    addToPlate(s.plates[0], 'seaweed');
    s.hand = 'fish_chopped';
    s.mouse = { x: 640, y: 460 };
    s.score.total = 2340;
    s.score.combo = 5;
    s.score.served = 8;
    s.board.servedThisLevel = 8;
    return s;
  }

  // cover — the richest single frame
  const s = baseState(2);
  s.levelTimeLeft = 132;
  seedTicket(s, 'burger', 58, 70);
  seedTicket(s, 'sushi', 33, 70);
  seedTicket(s, 'pasta', 47, 70);
  const [board, grill, pot] = s.stations;
  placeOnStation(board, 'lettuce');
  board.progress = 0.7;
  placeOnStation(grill, 'patty');
  grill.progress = 0.45;
  placeOnStation(pot, 'rice');
  pot.progress = 0.65;
  addToPlate(s.plates[0], 'bun');
  addToPlate(s.plates[0], 'patty_grilled');
  addToPlate(s.plates[0], 'lettuce_chopped');
  addToPlate(s.plates[1], 'noodles_boiled');
  addToPlate(s.plates[1], 'tomato_chopped');
  s.hand = 'cheese';
  s.mouse = { x: 640, y: 460 };
  s.score.total = 1250;
  s.score.combo = 3;
  s.score.served = 5;
  s.board.servedThisLevel = 5;
  return s;
}
