// Polish iteration 1 (2026-05-13): upweight breath so the speech pill reads as
// "alive" instead of "static". Amplitude bumped 1.5x (y) and 2x (scale) while
// preserving the 5.6s mirror-loop duration so cadence/feel stays the same.
export const SPEECH_FLOAT_AMPLITUDE_PX = 2.4;
export const SPEECH_FLOAT_SCALE_AMPLITUDE = 0.006;

export const SPEECH_FLOAT_ANIMATE = {
  y: [0, -SPEECH_FLOAT_AMPLITUDE_PX, 0, SPEECH_FLOAT_AMPLITUDE_PX, 0],
  scale: [
    1,
    1 + SPEECH_FLOAT_SCALE_AMPLITUDE,
    1,
    1 + SPEECH_FLOAT_SCALE_AMPLITUDE,
    1
  ]
};

export const SPEECH_FLOAT_TRANSITION = {
  duration: 5.6,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "loop" as const,
  ease: "easeInOut" as const
} as const;
