export const SPEECH_FLOAT_AMPLITUDE_PX = 1.6;

export const SPEECH_FLOAT_ANIMATE = {
  y: [-SPEECH_FLOAT_AMPLITUDE_PX, SPEECH_FLOAT_AMPLITUDE_PX],
  scale: [1, 1.004]
} as const;

export const SPEECH_FLOAT_TRANSITION = {
  duration: 4.8,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "mirror",
  ease: "easeInOut"
} as const;
