import { useEffect, useState } from "react";

export type ViewportSnapshot = {
  readonly width: number;
  readonly height: number;
  readonly isMobile: boolean;
};

export function useViewport(): ViewportSnapshot {
  const [viewport, setViewport] = useState<ViewportSnapshot>(() =>
    readViewport()
  );

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
}

export function readViewport(): ViewportSnapshot {
  if (typeof window === "undefined") {
    return { width: 1280, height: 800, isMobile: false };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768
  };
}
