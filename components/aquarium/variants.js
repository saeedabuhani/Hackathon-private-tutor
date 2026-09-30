// One aquarium per page. Every variant is the same engine with a different sea: colours, how many
// fish and bubbles, how strong the light is, and which extra creatures live in it (see scenes/).
// Backgrounds come from AQUARIUM_DESIGN.md: login #000d1a, feed #001a33, tutor #000a1a,
// explore #000d26, ai-studies #001a2e (each fades up to a lighter water colour at the top).

// Fish colours: [body, fin/tail, belly]
const TROPICAL = [
  ["#ff8a3d", "#ffcf5a", "#ffe3b0"],
  ["#3ec6ff", "#1d7be0", "#bff1ff"],
  ["#ffd23f", "#ff8a3d", "#fff2b3"],
  ["#ff5d8f", "#ffb0c8", "#ffd6e3"],
  ["#5be3b5", "#20a48a", "#c8fff0"],
  ["#a78bfa", "#6d5ce0", "#ddd2ff"],
];
const CALM = [
  ["#4aa8c8", "#2a7a9a", "#a8dcec"],
  ["#5cc4b0", "#2e8f80", "#b4eee2"],
  ["#7a9ae0", "#4a68b8", "#c6d4fa"],
];
const DEEP = [
  ["#2fd6c6", "#149a9a", "#a4fff4"],
  ["#5fa8ff", "#3a6ad8", "#c4ddff"],
  ["#c084fc", "#8a4ad8", "#ebd4ff"],
];

export const VARIANTS = {
  // "Gates of the deep sea": the grandest one, people stay here about a minute
  login: {
    top: "#07506a", bottom: "#000d1a", deep: "#000610",
    lightTop: "#a8e6f5", lightBottom: "#3f9cc4",
    fish: 13, fishColors: TROPICAL, fishSize: [0.8, 1.5], fishSpeed: [26, 62],
    bubbles: 46, bubbleSize: [3, 12], bubbleSpeed: [26, 70], bubbleArea: "full",
    rays: { count: 7, alpha: 0.13, width: 0.09 },
    parallax: 34, glow: 0,
  },
  // "Coral reef": lighter, greener, calm
  feed: {
    top: "#0a6a86", bottom: "#001a33", deep: "#00101f",
    lightTop: "#bdeefa", lightBottom: "#53b4d8",
    fish: 9, fishColors: TROPICAL, fishSize: [0.6, 1.05], fishSpeed: [14, 34],
    bubbles: 24, bubbleSize: [2, 6], bubbleSpeed: [18, 42], bubbleArea: "full",
    rays: { count: 5, alpha: 0.09, width: 0.1 },
    parallax: 20, glow: 0,
  },
  // "Submarine lab": almost black, a few small bubbles at the sides, one small fish
  tutor: {
    top: "#00203c", bottom: "#000a1a", deep: "#000610",
    lightTop: "#cdeff9", lightBottom: "#7ec4de",
    fish: 1, fishColors: CALM, fishSize: [0.7, 0.8], fishSpeed: [9, 12],
    bubbles: 14, bubbleSize: [1.6, 4.2], bubbleSpeed: [14, 30], bubbleArea: "sides",
    rays: { count: 2, alpha: 0.04, width: 0.14 },
    parallax: 8, glow: 0,
  },
  // "Open sea adventure": blue-violet, waves on top, bigger bubbles
  explore: {
    top: "#1a2c78", bottom: "#000d26", deep: "#00071a",
    lightTop: "#c9d6ff", lightBottom: "#7c98e8",
    fish: 6, fishColors: TROPICAL, fishSize: [0.7, 1.2], fishSpeed: [20, 46],
    bubbles: 26, bubbleSize: [4, 15], bubbleSpeed: [22, 56], bubbleArea: "full",
    rays: { count: 5, alpha: 0.1, width: 0.11 },
    parallax: 26, glow: 0,
  },
  // "Deep-sea research station": dark turquoise, things that glow
  "ai-studies": {
    top: "#05485c", bottom: "#001a2e", deep: "#000c18",
    lightTop: "#b6f0f0", lightBottom: "#4bb4c4",
    fish: 6, fishColors: DEEP, fishSize: [0.7, 1.15], fishSpeed: [14, 30],
    bubbles: 12, bubbleSize: [2, 6], bubbleSpeed: [14, 30], bubbleArea: "full",
    rays: { count: 3, alpha: 0.05, width: 0.12 },
    parallax: 22, glow: 44,
  },
};
