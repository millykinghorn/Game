// Level 1 – Across the Bar. Everything here is data, so it's easy to tweak.
// d = metres from the street edge. Lanes are numbered 0 (left) .. 4 (right).

export const LEVEL1 = {
  title: 'Level 1',
  subtitle: 'Across the Bar',
  speed: 3.0,          // forward run speed, m/s
  hitPenalty: 3,       // seconds added when you bump into someone / get splashed
  slipPenalty: 1,      // seconds added for slipping in a puddle
  endD: 39.6,          // where the run stops (just before character 2)
  message: "There you are.\n(Your message goes here.)",

  // Lane guide along the run: [d, centre x, lane spacing].
  // Wide in the courtyard, squeezes for the doorway, opens up inside.
  lanes: [
    [0, -1.5, 0.95],
    [7.2, -1.5, 0.95],
    [11.2, -1.1, 0.42],
    [14.2, -1.1, 0.42],
    [17.0, 0.1, 1.0],
    [60, 0.1, 1.0],
  ],

  // Things you can bump into.
  //  stand:  someone standing in a lane (sways a little)
  //  walk:   someone stepping back and forth between two lanes
  //  puddle: spilled drink – you slip sideways
  //  throw:  someone at the side sloshes a drink across the lanes (watch for the raised glass)
  //  dance:  a dancer drifting around a lane
  obstacles: [
    // courtyard
    { type: 'stand', d: 3.6, lane: 1 },
    { type: 'stand', d: 3.9, lane: 3, drink: true },
    { type: 'walk', d: 6.3, from: 4, to: 1, period: 3.6 },
    { type: 'puddle', d: 8.2, lane: 2 },
    { type: 'stand', d: 9.4, lane: 0 },
    { type: 'stand', d: 9.6, lane: 4, drink: true },
    // doorway squeeze: someone stepping out
    { type: 'walk', d: 12.9, from: 0, to: 4, period: 2.6 },
    // booths & bar
    { type: 'stand', d: 16.4, lane: 0 },
    { type: 'stand', d: 16.6, lane: 4, drink: true },
    { type: 'throw', d: 19.2, x: -3.0, toward: 1 },
    { type: 'stand', d: 19.6, lane: 4, drink: true },
    { type: 'puddle', d: 21.2, lane: 2 },
    { type: 'stand', d: 22.6, lane: 3 },
    { type: 'stand', d: 22.8, lane: 4, drink: true },
    { type: 'stand', d: 22.4, lane: 0 },
    { type: 'walk', d: 24.6, from: 0, to: 3, period: 3.4 },
    { type: 'throw', d: 26.6, x: 2.6, toward: -1 },
    { type: 'stand', d: 26.9, lane: 0 },
    { type: 'stand', d: 28.4, lane: 1 },
    { type: 'stand', d: 28.6, lane: 2, drink: true },
    { type: 'walk', d: 30.6, from: 4, to: 0, period: 4.0 },
    { type: 'stand', d: 32.2, lane: 0 },
    { type: 'stand', d: 32.4, lane: 3 },
    { type: 'stand', d: 32.0, lane: 4, drink: true },
    // dance floor
    { type: 'dance', d: 34.0, lane: 1 },
    { type: 'dance', d: 34.3, lane: 4 },
    { type: 'dance', d: 35.6, lane: 2, range: 0.9 },
    { type: 'throw', d: 36.2, x: -4.6, toward: 1 },
    { type: 'dance', d: 37.0, lane: 0 },
    { type: 'dance', d: 37.2, lane: 3, range: 0.6 },
    { type: 'dance', d: 38.4, lane: 1, range: 0.8 },
    { type: 'dance', d: 38.6, lane: 4 },
  ],

  // Background crowd (never in the way): [x, d, faceDeg, pose]
  // pose: 'idle' | 'dance' | 'seat'
  decor: [
    // courtyard: smokers on the deck, people at the dumpling hatch
    [2.8, 6.07, 0, 'seat'], [4.2, 6.07, 0, 'seat'], [3.4, 8.32, 180, 'seat'],
    [2.8, 9.27, 0, 'seat'], [4.2, 9.27, 0, 'seat'], [3.0, 11.52, 180, 'seat'], [4.4, 11.52, 180, 'seat'],
    [5.5, 7.6, 240, 'idle'], [1.4, 7.4, 90, 'idle'], [1.5, 11.0, 220, 'idle'], [5.3, 10.6, 260, 'idle'],
    [-5.4, 4.0, 100, 'idle'], [-4.7, 2.2, 80, 'idle'], [-5.0, 13.2, 120, 'idle'],
    [-4.6, 8.1, 20, 'idle'], [-5.5, 8.2, 340, 'idle'],
    // booths (seated)
    [-4.9, 14.15, 0, 'seat'], [-3.3, 14.15, 0, 'seat'], [-4.9, 16.15, 180, 'seat'], [-3.3, 16.15, 180, 'seat'],
    [-4.9, 19.7, 0, 'seat'], [-3.3, 19.7, 0, 'seat'], [-4.1, 21.65, 180, 'seat'],
    [-4.9, 25.15, 0, 'seat'], [-4.9, 27.1, 180, 'seat'], [-3.3, 27.1, 180, 'seat'],
    // propping up the bar
    [2.55, 17.4, 270, 'idle'], [2.6, 18.6, 260, 'idle'], [2.5, 20.6, 280, 'idle'], [2.6, 21.6, 265, 'idle'],
    [2.55, 23.9, 270, 'idle'], [2.6, 25.0, 250, 'idle'], [2.5, 27.8, 280, 'idle'], [2.6, 29.2, 270, 'idle'],
    [2.6, 30.4, 230, 'idle'],
    // standing about in the gaps
    [-2.3, 17.8, 60, 'idle'], [-2.3, 23.2, 120, 'idle'], [-2.4, 29.4, 90, 'idle'], [-3.6, 30.6, 45, 'idle'],
    [-5.2, 31.4, 80, 'idle'], [-4.4, 28.6, 160, 'idle'], [-5.0, 18.0, 90, 'idle'], [-5.2, 23.0, 90, 'idle'],
    [4.8, 31.6, 220, 'idle'], [3.6, 32.0, 200, 'idle'],
    // dance floor edges
    [-4.8, 34.0, 60, 'dance'], [-3.6, 35.2, 30, 'dance'], [-4.6, 36.8, 90, 'dance'], [-3.4, 38.2, 20, 'dance'],
    [-4.9, 39.6, 120, 'dance'], [-2.8, 40.6, 0, 'dance'], [3.4, 34.4, 300, 'dance'], [4.8, 35.6, 260, 'dance'],
    [3.0, 37.4, 320, 'dance'], [4.6, 38.6, 270, 'dance'], [3.6, 40.2, 200, 'dance'], [5.1, 41.0, 240, 'dance'],
    [2.6, 41.4, 200, 'dance'], [-2.4, 33.6, 180, 'dance'],
  ],
};

// x position of a lane at distance d (lanes bend and squeeze along the run)
export function laneX(lane, d, lanes = LEVEL1.lanes) {
  let i = 0;
  while (i < lanes.length - 2 && d > lanes[i + 1][0]) i++;
  const [d0, c0, s0] = lanes[i], [d1, c1, s1] = lanes[i + 1];
  const t = Math.min(1, Math.max(0, (d - d0) / (d1 - d0)));
  const e = t * t * (3 - 2 * t);
  const c = c0 + (c1 - c0) * e, s = s0 + (s1 - s0) * e;
  return c + (lane - 2) * s;
}
