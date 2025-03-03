import { useCallback, useEffect, useRef } from "react";
import "./course-clear.css";

interface CourseClearProps {
  text?: string;
  barCount?: number;
}

interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

function cancelable<T>(cancel: () => void, promise: Promise<T>) {
  const cp = promise as CancelablePromise<T>;
  cp.cancel = cancel;
  return cp;
}

// Values captured from a screenshot using https://github.com/gillibrand/keyframe-gen
const WaveKeyframes = [
  {
    scale: "1 1",
  },
  {
    scale: "1 0.65",
  },
  {
    scale: "1 0.37",
  },
  {
    scale: "1 0.45",
  },
  {
    scale: "1 0.53",
  },
  {
    scale: "1 0.57",
  },
  {
    scale: "1 0.54",
  },
  {
    scale: "1 0.5",
  },
  {
    scale: "1 0.47",
  },
  {
    scale: "1 0.50",
  },
];

function once(fn: () => void) {
  let done = false;

  return () => {
    if (done) return;
    done = true;
    fn();
  };
}

export function CourseClear({ text = "Course Clear!", barCount = 22 }: CourseClearProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const animateWave = useCallback(() => {
    if (!domRef.current) return;
    if (cleanupRef.current) cleanupRef.current();
    domRef.current.classList.remove("is-finished");

    const bars: HTMLDivElement[] = [];

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = "course-clear__bar";
      bar.style.insetInlineStart = `calc(100% / ${barCount}  * ${i})`;
      bar.style.width = `calc(100% / ${barCount} + 1px)`;
      domRef.current.appendChild(bar);
      bars.push(bar);
    }

    const anims: Animation[] = [];

    const cleanup = once(function cleanup() {
      clearInterval(id);
      anims.forEach((anim) => anim.finish());
      bars.forEach((bar) => bar.parentNode?.removeChild(bar));
      cleanupRef.current = null;
      domRef.current?.classList.add("is-finished");
    });
    cleanupRef.current = cleanup;

    let i = 0;
    const id = setInterval(() => {
      const bar = bars[i++];
      if (!bar) {
        clearInterval(id);
        return;
      }

      const anim = bar.animate(WaveKeyframes, {
        easing: "ease-out",
        duration: 1000,
        fill: "forwards",
      });

      anims.push(anim);

      if (i >= barCount) {
        anim.finished.finally(cleanup);
      }
    }, 30);

    return cleanup;
  }, [barCount]);

  const animateCurtains = useCallback(() => {
    if (!domRef.current) return;
    if (cleanupRef.current) cleanupRef.current();

    domRef.current.classList.remove("is-finished");

    const top = document.createElement("div");
    top.className = "course-clear__curtain course-clear__curtain--top";
    const bottom = document.createElement("div");
    bottom.className = "course-clear__curtain course-clear__curtain--bottom";

    domRef.current.appendChild(top);
    domRef.current.appendChild(bottom);

    const timer = requestAnimationFrame(() => {
      // This ensure we have done an initial layout, then add the class to transition after
      requestAnimationFrame(() => {
        top.classList.add("is-shrink");
        bottom.classList.add("is-shrink");
      });
    });

    const cleanup = once(() => {
      [top, bottom].forEach((curtain) => curtain.parentNode?.removeChild(curtain));
      clearTimeout(timer);
    });

    cleanupRef.current = cleanup;

    return cancelable(
      cleanup,
      new Promise<void>((resolve) => {
        bottom.addEventListener("transitionend", () => {
          cleanup();
          resolve();
          cleanupRef.current = null;
        });
      })
    );
  }, []);

  const animateAll = useCallback(async () => {
    const curtainsPromise = animateCurtains();
    await curtainsPromise;
    const waveCancel = animateWave();

    return () => {
      if (curtainsPromise) curtainsPromise.cancel();
      if (waveCancel) waveCancel();
    };
  }, [animateCurtains, animateWave]);

  useEffect(() => {
    animateAll();
  }, [animateAll]);

  return (
    <div className="course-clear" ref={domRef} onClick={animateAll}>
      <div className="course-clear__text-row">
        <span className="course-clear__text-wrapper">
          <span className="course-clear__text">{text}</span>
        </span>
      </div>
    </div>
  );
}
