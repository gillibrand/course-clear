import { PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import "./course-clear.css";

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

/**
 * Decorates a function so it can only be called once. Used for cleanup functions that might be
 * called normally or during unmount.
 *
 * @param fn Function to call (once).
 * @returns New function that will call the given fn on the first call only.
 */
function once(fn: () => void) {
  let done = false;

  return () => {
    if (done) return;
    done = true;
    fn();
  };
}

interface CourseClearProps {
  /**
   * Greeting message to animate in before main content show.
   */
  greeting?: string;

  /**
   * How many vertical stripes to animate for the wave effect. If undefined, will use a number
   * appropriate for the screen width.
   */
  barCount?: number;

  children?: ReactNode;
}

export function CourseClear({ greeting = "Course Clear!", barCount, children }: CourseClearProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isShowChildren, setIsShowChildren] = useState(false);

  function showChildren() {
    setIsShowChildren(true);
  }

  function getBarCount() {
    if (typeof barCount === "number" && barCount > 0) return barCount;
    return window.innerWidth > 768 ? 22 : 11;
  }

  const animateWave = useCallback(() => {
    if (!domRef.current) return;
    if (cleanupRef.current) cleanupRef.current();
    domRef.current.classList.remove("is-wave-finished");

    const bars: HTMLDivElement[] = [];

    const barCount = getBarCount();

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = "course-clear__bar";
      bar.style.insetInlineStart = `calc(100% / ${barCount}  * ${i})`;
      bar.style.width = `calc(100% / ${barCount} + 1px)`;
      domRef.current.appendChild(bar);
      bars.push(bar);
    }

    const anims: Animation[] = [];

    let intervalId: number;

    const cleanup = once(function cleanup() {
      clearInterval(intervalId);
      anims.forEach((anim) => anim.finish());
      bars.forEach((bar) => bar.parentNode?.removeChild(bar));
      cleanupRef.current = null;
      domRef.current?.classList.add("is-wave-finished");
    });
    cleanupRef.current = cleanup;

    return cancelable(
      cleanup,
      new Promise<void>((resolve) => {
        let i = 0;
        intervalId = setInterval(() => {
          const bar = bars[i++];
          if (!bar) {
            clearInterval(intervalId);
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
            resolve();
          }
        }, 30);
      })
    );
  }, [barCount]);

  const animateCurtains = useCallback(() => {
    if (!domRef.current) return;
    if (cleanupRef.current) cleanupRef.current();

    domRef.current.classList.remove("is-wave-finished", "is-curtains-finished");

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
      cancelAnimationFrame(timer);
    });

    cleanupRef.current = cleanup;

    return cancelable(
      cleanup,
      new Promise<void>((resolve) => {
        bottom.addEventListener("transitionend", () => {
          domRef.current?.classList.add("is-curtains-finished");
          cleanup();
          resolve();
          cleanupRef.current = null;
        });
      })
    );
  }, []);

  const animateAll = useCallback(async () => {
    setIsShowChildren(false);

    const curtainsPromise = animateCurtains();
    await curtainsPromise;
    const wavePromise = animateWave();
    await wavePromise;

    return () => {
      if (curtainsPromise) curtainsPromise.cancel();
      if (wavePromise) wavePromise.cancel();
    };
  }, [animateCurtains, animateWave]);

  useEffect(() => {
    animateAll();
  }, [animateAll]);

  return (
    <div className="course-clear" ref={domRef}>
      <div className="course-clear__content">
        {!isShowChildren && (
          <div className="course-clear__message" onAnimationEnd={showChildren}>
            {greeting}
          </div>
        )}
        <div className="course-clear__children">{children}</div>
      </div>
    </div>
  );
}
