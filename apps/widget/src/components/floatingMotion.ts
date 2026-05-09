export const SPEECH_FLOAT_AMPLITUDE_PX = 1.6;

export const SPEECH_FLOAT_ANIMATE = {
  y: [0, -SPEECH_FLOAT_AMPLITUDE_PX, 0, SPEECH_FLOAT_AMPLITUDE_PX, 0],
  scale: [1, 1.003, 1, 1.003, 1]
};

export const SPEECH_FLOAT_TRANSITION = {
  duration: 5.6,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "loop" as const,
  ease: "easeInOut" as const
} as const;
