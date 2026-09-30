// One frame for the video of all three feeds (StudyFeed, Explore, AI Studies): fills the whole
// center column, 75vh tall, rounded, black background, always visible.
//
// The size is set with an inline style on purpose: Tailwind classes written in this file were
// never generated (lib/ was not in tailwind.config content), so the frame collapsed to 0 height
// and the iframe was clipped away — audio but no picture. Inline styles can't be purged.
export const VIDEO_FRAME = "relative w-full overflow-hidden";

export const VIDEO_FRAME_STYLE = {
  position: "relative",
  width: "100%",
  height: "75vh",
  minHeight: 320,
  borderRadius: 16,
  background: "#000",
  overflow: "hidden",
  // thin hairline + soft depth (design only)
  boxShadow:
    "0 0 0 1px rgba(139, 124, 246, 0.3), 0 16px 48px rgba(0, 0, 0, 0.45), 0 0 40px rgba(91, 141, 239, 0.08)",
};

// The absolutely positioned box that holds the YouTube iframe, and the iframe itself
export const VIDEO_PLAYER_STYLE = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
};

// Center column [ video ][ sidebar 260px ]; stacked on small screens
export const VIDEO_LAYOUT = "grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-start";
