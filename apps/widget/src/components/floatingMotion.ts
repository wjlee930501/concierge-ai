// Keep speech motion as a light vertical float. Avoid scale keyframes so the
// bubble reads as hovering, not resizing, when content or choices change.
export const SPEECH_FLOAT_AMPLITUDE_PX = 2.4;

export const SPEECH_FLOAT_ANIMATE = {
  y: [0, -SPEECH_FLOAT_AMPLITUDE_PX, 0, SPEECH_FLOAT_AMPLITUDE_PX, 0]
};

export const SPEECH_FLOAT_TRANSITION = {
  duration: 5.6,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "loop" as const,
  ease: "easeInOut" as const
} as const;
