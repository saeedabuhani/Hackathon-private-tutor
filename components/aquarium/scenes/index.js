import { loginScene } from "./login";
import { tutorScene } from "./tutor";
import { feedScene } from "./feed";
import { exploreScene } from "./explore";
import { aiScene } from "./aiStudies";

// The special animals and scenery of each variant. Every scene may define:
//   setup(W)    set sizes that depend on the window (like where the water surface is)
//   init(W)     build its objects once      update(W, dt)   move them
//   back(W)     draw behind the fish        front(W)        draw in front of the fish and bubbles
//   resize(W)   react to a new window size  fishExtra(W, fish, offsetX, alpha)  decorate a fish
// (W is the shared world made in AquariumCanvas.js)
export const SCENES = {
  login: loginScene,
  feed: feedScene,
  tutor: tutorScene,
  explore: exploreScene,
  "ai-studies": aiScene,
};
