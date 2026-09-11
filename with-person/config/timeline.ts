export type Vec3 = [number, number, number];
export const scenes = [
  {
    start: 0,
    end: 0.05,
    label: "Take your seat",
    title: "Nine bars.\nTwenty-five seconds.",
    description: "Your barista. Your coffee. Take your time.",
    detail: "A RITUAL, MADE BY HAND",
  },
  {
    start: 0.05,
    end: 0.18,
    label: "Grind & dose",
    title: "Eighteen grams.\nGround fresh.",
    description: "The barista catches the grounds in the basket.",
    detail: "01 / GRIND",
  },
  {
    start: 0.18,
    end: 0.28,
    label: "The tamp",
    title: "One firm,\neven press.",
    description: "A level bed. Just enough resistance.",
    detail: "02 / TAMP",
  },
  {
    start: 0.28,
    end: 0.37,
    label: "Lock it in",
    title: "A quarter turn.\nReady.",
    description: "The basket locks into the group head.",
    detail: "03 / LOCK",
  },
  {
    start: 0.37,
    end: 0.44,
    label: "Cup in place",
    title: "Everything\nin its place.",
    description: "An empty cup beneath the spouts. One press.",
    detail: "04 / BEGIN",
  },
  {
    start: 0.44,
    end: 0.6,
    label: "The extraction",
    title: "Twenty-five\nseconds.",
    description: "Nine bars of pressure. Two golden streams.",
    detail: "05 / EXTRACT",
  },
  {
    start: 0.6,
    end: 0.71,
    label: "The finish",
    title: "A little\nsoftness.",
    description: "Steam the milk. Then a gentle pour.",
    detail: "06 / FINISH",
  },
  {
    start: 0.71,
    end: 0.82,
    label: "Served to you",
    title: "Made by hand.\nHanded to you.",
    description: "The barista brings your cup across the counter.",
    detail: "07 / SERVE",
  },
  {
    start: 0.82,
    end: 0.9,
    label: "The lift",
    title: "Yours now.",
    description: "Fingers around the handle. A moment to pause.",
    detail: "08 / LIFT",
  },
  {
    start: 0.9,
    end: 0.96,
    label: "The first sip",
    title: "The first sip.",
    description: "This is what all that care was for.",
    detail: "09 / ENJOY",
  },
  {
    start: 0.96,
    end: 1,
    label: "Stay a little",
    title: "And then it is\njust coffee.",
    description: "Good company. A little more time.",
    detail: "THE SIMPLE THINGS",
  },
];
// The revised route stays with visible human actions and arcs toward the customer.
export const cameraKeyframes: { at: number; position: Vec3; target: Vec3 }[] = [
  { at: 0, position: [0, 3.2, 9.2], target: [0.4, 1.6, 0] },
  { at: 0.05, position: [0, 3.2, 9], target: [0.35, 1.5, 0] },
  { at: 0.18, position: [-0.2, 3, 7.8], target: [-0.1, 1.3, 0] },
  { at: 0.28, position: [0.1, 2.8, 7.4], target: [0.35, 1.15, 0.1] },
  { at: 0.37, position: [0.5, 2.8, 7.3], target: [0.6, 1.3, 0] },
  { at: 0.44, position: [0.8, 2.8, 7.1], target: [0.8, 1.2, 0.05] },
  { at: 0.6, position: [1, 2.8, 7.1], target: [1.0, 1.3, 0.1] },
  { at: 0.71, position: [0.8, 2.8, 7.2], target: [0.5, 1.25, 0] },
  { at: 0.82, position: [0.5, 3, 7.7], target: [-0.9, 1.45, 0.6] },
  { at: 0.9, position: [0.4, 2.9, 7], target: [-1.45, 1.5, 1.1] },
  { at: 0.96, position: [0.3, 2.9, 6.7], target: [-1.5, 1.5, 1.1] },
  { at: 1, position: [0.1, 3.1, 8.4], target: [-0.7, 1.5, 0.35] },
];
export function splineTime(p: number) {
  const i = cameraKeyframes.findIndex(
    (k, index) =>
      index < cameraKeyframes.length - 1 && p <= cameraKeyframes[index + 1].at,
  );
  const index = i < 0 ? cameraKeyframes.length - 2 : i;
  const a = cameraKeyframes[index],
    b = cameraKeyframes[index + 1];
  const t = Math.max(0, Math.min(1, (p - a.at) / (b.at - a.at)));
  return (index + t * t * (3 - 2 * t)) / (cameraKeyframes.length - 1);
}
// The internal-machine route is retired in this revision, so head motion stays external.
export const insideMachine = () => 0;
