import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
// import "./CourseClear.module.css";
import s from "./course-clear.module.css";

console.info(">>> ", s.asd);

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

function CourseClear({ greeting = "Course Clear!", barCount, children }: CourseClearProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isShowChildren, setIsShowChildren] = useState(false);

  function showChildren() {
    setIsShowChildren(true);
  }

  const getBarCount = useCallback(() => {
    if (typeof barCount === "number" && barCount > 0) return barCount;
    return window.innerWidth > 768 ? 22 : 11;
  }, [barCount]);

  const animateWave = useCallback(() => {
    if (!domRef.current) return;
    if (cleanupRef.current) cleanupRef.current();
    domRef.current.classList.remove(s.isWaveFinished);

    const bars: HTMLDivElement[] = [];

    const barCount = getBarCount();

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = s.CourseClear__bar;
      bar.style.insetInlineStart = `calc(100% / ${barCount}  * ${i})`;
      bar.style.width = `calc(100% / ${barCount} + 1px)`;
      domRef.current.appendChild(bar);
      bars.push(bar);
    }

    const anims: Animation[] = [];

    let intervalId: ReturnType<typeof setTimeout>;

    const cleanup = once(function cleanup() {
      clearInterval(intervalId);
      anims.forEach((anim) => anim.finish());
      bars.forEach((bar) => bar.parentNode?.removeChild(bar));
      cleanupRef.current = null;
      domRef.current?.classList.add(s.isWaveFinished);
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
  }, [getBarCount]);

  const animateCurtains = useCallback(() => {
    if (!domRef.current) return;
    if (cleanupRef.current) cleanupRef.current();

    domRef.current.classList.remove(s.isWaveFinished, s.isCurtainsFinished);

    const top = document.createElement("div");
    top.className = `${s.CourseClear__curtain} ${s.CourseClear__curtainTop}`;
    const bottom = document.createElement("div");
    bottom.className = `${s.CourseClear__curtain} ${s.CourseClear__curtainBottom}`;

    domRef.current.appendChild(top);
    domRef.current.appendChild(bottom);

    const timer = requestAnimationFrame(() => {
      // This ensure we have done an initial layout, then add the class to transition after
      requestAnimationFrame(() => {
        top.classList.add(s.isShrink);
        bottom.classList.add(s.isShrink);
      });
    });

    const cleanup = once(() => {
      [top, bottom].forEach((curtain) => curtain.parentNode?.removeChild(curtain));
      cancelAnimationFrame(timer);
      // domRef.current?.classList.remove(s.isCurtainsFinished);
    });

    cleanupRef.current = cleanup;

    return cancelable(
      cleanup,
      new Promise<void>((resolve) => {
        bottom.addEventListener("transitionend", () => {
          cleanup();
          domRef.current?.classList.add(s.isCurtainsFinished);
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
    <div className={s.CourseClear} ref={domRef}>
      <div className={s.CourseClear__content}>
        {!isShowChildren && (
          <div className={s.CourseClear__message} onAnimationEnd={showChildren}>
            {greeting}
          </div>
        )}
        {isShowChildren && <div className={s.CourseClear__children}>{children}</div>}
      </div>
    </div>
  );
}

export { CourseClear };
export type { CourseClearProps };
