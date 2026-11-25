// cooking-stations.js — the three work stations and their processing state machine.
// raw -> working (timer) -> done -> (left too long on grill/pot) burnt.
// The cutting board never burns. One item per station, click to place / collect.

import { INGREDIENTS, processResult, processTime, stationFor } from './recipes.js';

export const STATION_DEFS = {
  board: { id: 'board', name: '砧板', en: 'Cutting Board', verb: '切菜中', color: '#c98f4e', burnAfter: Infinity },
  grill: { id: 'grill', name: '煎锅', en: 'Grill Pan', verb: '煎制中', color: '#5b6b7a', burnAfter: 7 },
  pot: { id: 'pot', name: '汤锅', en: 'Stock Pot', verb: '煮制中', color: '#7a6a8a', burnAfter: 7 },
};

export function createStation(kind) {
  return {
    kind,
    def: STATION_DEFS[kind],
    item: null,        // raw ingredient id currently on the station
    progress: 0,       // 0..1 of the processing time
    state: 'empty',    // empty | working | done | burnt
    doneFor: 0,        // seconds since finished (burn clock)
    sizzle: 0,         // visual steam accumulator
  };
}

export function createStations() {
  return [createStation('board'), createStation('grill'), createStation('pot')];
}

// Can this station take this raw ingredient right now?
export function stationAccepts(station, ingredientId) {
  if (!station || station.state !== 'empty') return false;
  return stationFor(ingredientId) === station.kind;
}

export function placeOnStation(station, ingredientId) {
  if (!stationAccepts(station, ingredientId)) return false;
  station.item = ingredientId;
  station.progress = 0;
  station.state = 'working';
  station.doneFor = 0;
  return true;
}

// Advance all stations. Returns events the caller turns into sound/particles.
export function tickStations(stations, dt) {
  const events = [];
  for (const st of stations) {
    if (st.state === 'working') {
      const total = processTime(st.item);
      st.progress = Math.min(1, st.progress + dt / total);
      st.sizzle += dt;
      if (st.progress >= 1) {
        st.state = 'done';
        st.doneFor = 0;
        events.push({ type: 'station-done', station: st });
      }
    } else if (st.state === 'done') {
      st.doneFor += dt;
      if (st.doneFor >= st.def.burnAfter) {
        st.state = 'burnt';
        events.push({ type: 'station-burnt', station: st });
      }
    }
  }
  return events;
}

// Take the finished (or burnt) item off the station. Returns the ingredient id
// now in the player's hand, or null when nothing can be taken.
export function takeFromStation(station) {
  if (station.state === 'done') {
    const result = processResult(station.item);
    clearStation(station);
    return result;
  }
  if (station.state === 'burnt') {
    clearStation(station);
    return 'burnt';
  }
  return null;
}

export function clearStation(station) {
  station.item = null;
  station.progress = 0;
  station.state = 'empty';
  station.doneFor = 0;
}

export function stationStatusText(station) {
  if (station.state === 'empty') return '空闲';
  if (station.state === 'working') {
    const ing = INGREDIENTS[station.item];
    return `${station.def.verb} · ${ing ? ing.name : ''}`;
  }
  if (station.state === 'done') {
    const ing = INGREDIENTS[processResult(station.item)];
    return `好了！${ing ? ing.name : ''}`;
  }
  return '烧焦了！';
}
