import cssString from "./course-clear-css.js";
import { html } from "./lib.js";

interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

function cancelable<Args extends unknown[], T>(cancel: (...args: Args) => void, promise: Promise<T>) {
  // cancel();
  return Object.assign(promise, {
    cancel,
  }) as CancelablePromise<T>;
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
 * called normally or during disconnect.
 *
 * @param fn Function to call (once).
 * @returns New function that will call the given fn on the first call only.
 */
function once<Args extends unknown[]>(fn: (...args: Args) => void) {
  let done = false;

  return (...args: Args) => {
    if (done) return;
    done = true;
    fn(...args);
  };
}

export class CourseClearWeb extends HTMLElement {
  // So we can set props by index
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  private _active: CancelablePromise<void> | undefined;

  private _greetingEl = null as unknown as HTMLDivElement;
  private _childrenEl = null as unknown as HTMLDivElement;
  private _rootEl = null as unknown as HTMLDialogElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render();
    this._hideOrRunAnimations();
  }

  disconnectedCallback() {
    this._cancelActive();
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(value: boolean) {
    if (value) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
  }

  static get observedAttributes() {
    return ["open"];
  }

  attributeChangedCallback(name: string) {
    if (!this._rootEl) return;

    switch (name) {
      case "open":
        this._hideOrRunAnimations();
        return;
    }
  }

  private _getBarCount() {
    const barCount = parseInt(this.getAttribute("barCount") as string);
    if (typeof barCount === "number" && barCount > 0) return barCount;
    return window.innerWidth > 768 ? 22 : 11;
  }

  private _animateWave() {
    this._rootEl.classList.remove("is-wave-finished");

    const bars: HTMLDivElement[] = [];

    const barCount = this._getBarCount();

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = "CourseClear__bar";
      bar.style.insetInlineStart = `calc(100% / ${barCount}  * ${i})`;
      bar.style.width = `calc(100% / ${barCount} + 1px)`;
      this._rootEl.appendChild(bar);
      bars.push(bar);
    }

    const anims: Animation[] = [];

    let intervalId: ReturnType<typeof setTimeout>;

    const cleanup = once((isSuccess?: boolean) => {
      clearInterval(intervalId);
      anims.forEach((anim) => anim.finish());
      bars.forEach((bar) => bar.parentNode?.removeChild(bar));
      if (isSuccess) this._rootEl?.classList.add("is-wave-finished");
    });

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
            anim.finished.finally(() => {
              cleanup(true);
              resolve();
            });
          }
        }, 30);
      })
    );
  }

  private _animateCurtains() {
    this._rootEl.classList.remove("is-wave-finished", "is-curtains-finished");

    const top = document.createElement("div");
    top.className = "CourseClear__curtain CourseClear__curtain--top";
    const bottom = document.createElement("div");
    bottom.className = "CourseClear__curtain CourseClear__curtain--bottom";

    this._rootEl.appendChild(top);
    this._rootEl.appendChild(bottom);

    let frameID = requestAnimationFrame(() => {
      // This ensure we have done an initial layout, then add the class to transition after
      frameID = requestAnimationFrame(() => {
        top.classList.add("is-shrink");
        bottom.classList.add("is-shrink");
      });
    });

    const cleanup = once(() => {
      [top, bottom].forEach((curtain) => curtain.parentNode?.removeChild(curtain));
      cancelAnimationFrame(frameID);
    });

    return cancelable(
      cleanup,
      new Promise<void>((resolve) => {
        bottom.addEventListener("transitionend", () => {
          cleanup();
          this._rootEl.classList.add("is-curtains-finished");
          resolve();
        });
      })
    );
  }

  private _hideOrRunAnimations() {
    if (!this._rootEl) return;

    if (this.open) {
      this._rootEl.showModal();
      this._animateAll();
      return;
    }

    const cleanup = () => {
      this._rootEl.style.display = "none";
      this._rootEl.classList.remove("is-curtains-finished", "is-wave-finished");
      this._rootEl.close();
    };

    if (this._active) {
      // If active, just abort
      this._cancelActive();
      cleanup();
    } else {
      // We're done animating and settled, so animate out too/
      // remove curtains class early to trigger backdrop transition
      this._rootEl.classList.remove("is-curtains-finished");

      this._rootEl
        .animate(
          [
            {
              opacity: 1,
            },
            {
              opacity: 0,
            },
          ],
          {
            duration: 200,
          }
        )
        .finished.then(cleanup);
    }
  }

  private async _animateAll() {
    this._cancelActive();
    this._rootEl.style.display = "";

    this._greetingEl.textContent = this.getAttribute("greeting") || "Course Clear!";
    this._greetingEl.style.display = "";

    this._rootEl.classList.remove("is-curtains-finished", "is-wave-finished");

    this._active = this._animateCurtains();
    await this._active;
    this._active = this._animateWave();
    await this._active;
    this._active = undefined;
  }

  private _cancelActive() {
    if (this._active) this._active.cancel();
    this._active = undefined;
  }

  private _render() {
    this.shadowRoot!.innerHTML = html`<style>
        ${cssString}
      </style>
      <dialog class="CourseClear" id="_rootEl" style="display: none">
        <div class="CourseClear__content">
          <div class="CourseClear__greeting" id="_greetingEl"></div>
          <div class="CourseClear__children" id="_childrenEl">
            <slot />
          </div>
        </div>
      </dialog>`;

    // Ref all the elements with IDs
    this.shadowRoot!.querySelectorAll("[id]").forEach((el) => {
      this[el.id] = el;
    });

    // Events
    this._childrenEl.addEventListener("transitionend", () => {
      // Ensure this is hidden so it doesn't transition again if the host is toggles display none
      this._greetingEl.style.display = "none";
    });
  }
}

try {
  customElements.define("course-clear", CourseClearWeb);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = import.meta as any;
  if (meta.hot) {
    meta.hot.accept(() => {
      location.reload(); // Full page refresh as a last resort
    });
  }
} catch (e) {
  if ((e as Error).name === "NotSupportedError") location.reload();
}
