// "Submarine lab": almost nothing. The variant already gives a near-black sea, two faint rays and a
// few small bubbles at the sides; this scene only keeps ONE small fish in the bottom-right corner,
// turning around slowly so it never leaves it.
export const tutorScene = {
  init(W) {
    const f = W.fish[0];
    if (!f) return;
    f.z = 0.5;
    f.x = W.w * 0.86;
    f.baseY = W.h * 0.9;
    f.amp = 14;
    f.dir = -1;
  },
  update(W) {
    const f = W.fish[0];
    if (!f) return;
    f.baseY = W.h * 0.9;
    if (f.x < W.w * 0.8) f.dir = 1;
    else if (f.x > W.w * 0.97) f.dir = -1;
  },
};
