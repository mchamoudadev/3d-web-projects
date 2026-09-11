import type { Vec3 } from "./timeline";
export type Beat = { at: number; value: Vec3 };
export const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
export function track(p: number, keys: Beat[]): Vec3 {
  const index = keys.findIndex(
    (k, i) => i < keys.length - 1 && p <= keys[i + 1].at,
  );
  if (index < 0) return [...keys[keys.length - 1].value];
  const a = keys[index],
    b = keys[index + 1],
    t = ease((p - a.at) / (b.at - a.at));
  return a.value.map((v, i) => v + (b.value[i] - v) * t) as Vec3;
}
const k = (at: number, value: Vec3): Beat => ({ at, value });
export const cupTrack = [
  k(0, [0.3, 0.065, 1.6]),
  k(0.37, [0.3, 0.065, 1.6]),
  k(0.395, [0.7, 0.7, 1.0]),
  k(0.43, [1.4, 0.39, -0.12]),
  k(0.6, [1.4, 0.39, -0.12]),
  k(0.637, [0.55, 0.45, 1.15]),
  k(0.7, [0.55, 0.45, 1.15]),
  k(0.735, [0.8, 0.85, 0.9]),
  k(0.78, [-1.0, 0.35, 1.7]),
  k(0.8, [-1.0, 0.065, 1.7]),
  k(0.845, [-1.0, 0.065, 1.7]),
  k(0.885, [-1.8, 1.6, 1.8]),
  k(0.91, [-2.22, 2.15, 1.8]),
  k(0.945, [-2.22, 2.15, 1.8]),
  k(0.975, [-1.3, 0.8, 1.8]),
  k(1, [-1, 0.065, 1.7]),
];
export const filterTrack = [
  k(0, [1.4, 1.07, -0.17]),
  k(0.05, [1.4, 1.07, -0.17]),
  k(0.075, [0.7, 1.15, 0.65]),
  k(0.1, [-1.6, 0.68, -0.27]),
  k(0.17, [-1.6, 0.68, -0.27]),
  k(0.19, [-0.55, 0.18, 0.9]),
  k(0.27, [-0.55, 0.18, 0.9]),
  k(0.3, [0.3, 1.4, 0.85]),
  k(0.34, [1.4, 1.07, -0.17]),
  k(1, [1.4, 1.07, -0.17]),
];
const tamperTrack = [
  k(0, [-0.8, 0.04, 0.7]),
  k(0.18, [-0.8, 0.04, 0.7]),
  k(0.205, [-0.55, 0.65, 0.9]),
  k(0.235, [-0.55, 0.23, 0.9]),
  k(0.247, [-0.55, 0.23, 0.9]),
  k(0.26, [-0.55, 0.65, 0.9]),
  k(0.28, [-0.8, 0.04, 0.7]),
  k(1, [-0.8, 0.04, 0.7]),
];
const pitcherTrack = [
  k(0, [-0.2, 0.05, 0.45]),
  k(0.6, [-0.2, 0.05, 0.45]),
  k(0.63, [2.15, 0.5, 0.17]),
  k(0.66, [2.15, 0.5, 0.17]),
  k(0.68, [0.97, 1.05, 1.15]),
  k(0.7, [0.97, 1.05, 1.15]),
  k(0.735, [-0.2, 0.05, 0.45]),
  k(1, [-0.2, 0.05, 0.45]),
];
const plus = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export function sampleAction(p: number) {
  const cup = track(p, cupTrack),
    filter = track(p, filterTrack),
    tamper = track(p, tamperTrack),
    pitcher = track(p, pitcherTrack);
  const filterTurn =
    -0.7 * ease((p - 0.05) / 0.025) * (1 - ease((p - 0.335) / 0.015));
  const cupTilt =
    0.76 * ease((p - 0.895) / 0.025) * (1 - ease((p - 0.945) / 0.025));
  const pitcherTilt =
    0.8 * ease((p - 0.667) / 0.012) * (1 - ease((p - 0.7) / 0.015));
  const leftRest: Vec3 = [-0.85, 0.25, 0.0],
    rightRest: Vec3 = [-0.05, 0.27, 0.1];
  let left = track(p, [
    k(0, leftRest),
    k(0.035, leftRest),
    k(0.05, plus(filterTrack[0].value, [0, 0, 0.48])),
  ]);
  if (p >= 0.05 && p <= 0.35)
    left = plus(filter, [
      Math.sin(filterTurn) * 0.48,
      0,
      Math.cos(filterTurn) * 0.48,
    ]);
  if (p > 0.35 && p < 0.37)
    left = track(p, [
      k(0.35, plus(filter, [0, 0, 0.48])),
      k(0.37, plus(cup, [-0.29, 0.18, 0])),
    ]);
  if (p >= 0.37 && p <= 0.435) left = plus(cup, [-0.29, 0.18, 0]);
  if (p > 0.435 && p < 0.6)
    left = track(p, [
      k(0.435, [1.11, 0.57, -0.12]),
      k(0.46, leftRest),
      k(0.58, leftRest),
      k(0.6, [1.11, 0.57, -0.12]),
    ]);
  if (p >= 0.6 && p <= 0.8) left = plus(cup, [-0.29, 0.18, 0]);
  if (p > 0.8)
    left = track(p, [
      k(0.8, [-1.29, 0.245, 1.7]),
      k(0.83, leftRest),
      k(1, leftRest),
    ]);
  let right = rightRest;
  if (p >= 0.17 && p <= 0.285)
    right = track(p, [
      k(0.17, rightRest),
      k(0.18, [-0.8, 0.3, 0.7]),
      ...tamperTrack
        .filter((x) => x.at >= 0.205 && x.at <= 0.28)
        .map((x) => k(x.at, plus(x.value, [0, 0.23, 0]))),
      k(0.285, rightRest),
    ]);
  if (p > 0.285 && p < 0.6)
    right = track(p, [
      k(0.285, rightRest),
      k(0.35, rightRest),
      k(0.375, [0.59, 1.8, -0.015]),
      k(0.392, [0.59, 1.8, -0.065]),
      k(0.41, rightRest),
      k(0.585, rightRest),
      k(0.6, [0.05, 0.31, 0.45]),
    ]);
  if (p >= 0.6 && p <= 0.735)
    right = plus(pitcher, [
      Math.cos(pitcherTilt) * 0.25 - Math.sin(pitcherTilt) * 0.26,
      Math.sin(pitcherTilt) * 0.25 + Math.cos(pitcherTilt) * 0.26,
      0,
    ]);
  if (p > 0.735)
    right = track(p, [
      k(0.735, [0.05, 0.31, 0.45]),
      k(0.765, rightRest),
      k(1, rightRest),
    ]);
  const customerRestL: Vec3 = [-2.05, 0.19, 1.3],
    customerRestR: Vec3 = [-2.1, 0.2, 2.2];
  let customerR = customerRestR,
    customerL = customerRestL;
  const handle: Vec3 = [
    Math.cos(cupTilt) * 0.33 - Math.sin(cupTilt) * 0.2,
    Math.sin(cupTilt) * 0.33 + Math.cos(cupTilt) * 0.2,
    0,
  ];
  if (p >= 0.805) {
    customerR = track(p, [
      k(0.805, customerRestR),
      k(0.845, [-0.67, 0.265, 1.7]),
    ]);
    if (p >= 0.845) customerR = plus(cup, handle);
    customerL = track(p, [
      k(0.805, customerRestL),
      k(0.845, [-1.16, 0.145, 1.58]),
    ]);
    if (p >= 0.845) customerL = plus(cup, [-0.16, 0.08, -0.12]);
  }
  const fill = ease((p - 0.445) / 0.15) * (1 - 0.53 * ease((p - 0.915) / 0.03));
  return {
    cup,
    filter,
    tamper,
    pitcher,
    left,
    right,
    customerL,
    customerR,
    cupTilt,
    pitcherTilt,
    filterTurn,
    fill,
    pressure: 9 * ease((p - 0.405) / 0.04) * (1 - ease((p - 0.59) / 0.025)),
  };
}
