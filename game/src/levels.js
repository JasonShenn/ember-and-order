// levels.js — the three nights of the diner: quota, clock, pacing and rush hour.
// Level 1 teaches the loop, level 2 adds two dishes and faster tickets,
// level 3 adds ramen and the dinner rush. Nothing here touches the canvas.

import { recipesForLevel } from './recipes.js';

export const LEVELS = [
  {
    level: 1,
    name: '第一夜 · 开张',
    en: 'Night 1 — Opening',
    duration: 150,
    quota: 5,
    spawnInterval: 13,
    orderTime: 75,
    maxOrders: 3,
    rushAt: 45, // seconds left when rush hour starts
    starScores: [450, 700, 950],
  },
  {
    level: 2,
    name: '第二夜 · 口碑',
    en: 'Night 2 — Word of Mouth',
    duration: 180,
    quota: 7,
    spawnInterval: 11,
    orderTime: 70,
    maxOrders: 4,
    rushAt: 50,
    starScores: [700, 1050, 1400],
  },
  {
    level: 3,
    name: '第三夜 · 深夜食堂',
    en: 'Night 3 — Midnight Rush',
    duration: 210,
    quota: 9,
    spawnInterval: 9,
    orderTime: 65,
    maxOrders: 4,
    rushAt: 60,
    starScores: [950, 1450, 1950],
  },
];

export function levelDef(level) {
  return LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1];
}

export function levelRecipes(level) {
  return recipesForLevel(level);
}

// Stars from the score of a finished level: 0-3.
export function starsForScore(level, score) {
  const def = levelDef(level);
  let stars = 0;
  for (const threshold of def.starScores) {
    if (score >= threshold) stars += 1;
  }
  return stars;
}

// Rush hour: the last stretch of a level. Spawning speeds up and tips grow.
export function isRushHour(level, timeLeft) {
  return timeLeft <= levelDef(level).rushAt && timeLeft > 0;
}

export function spawnIntervalFor(level, timeLeft) {
  const base = levelDef(level).spawnInterval;
  return isRushHour(level, timeLeft) ? base * 0.55 : base;
}
