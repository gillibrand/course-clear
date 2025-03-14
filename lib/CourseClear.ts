import cssString from "./course-clear-css.js";
import { html } from "./util.js";

const ClosedEvent = new Event("closed", {
  bubbles: true,
  composed: true,
});

const OpenedEvent = new CustomEvent("opened", {
  bubbles: true,
  composed: true,
});

/**
 * A promise that can be canceled.
 */
interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

/**
 * Wraps a promise as a cancelable promise.
 *
 * @param cancel Function to call on cancel.
 * @param promise A normal promise to add the cancel function to.
 * @returns Given promise that can be canceled.
 */
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

/**
 * Component to open the dialog with an animation. Set the `greeting` attribute for the short,
 * initial message to animate in. Children are shown as the main content of the dialog after the
 * animation.
 *
 * Be sure to add a way to close the dialog or progress somehow since it does not have its own close
 * button. Optionall add the `close-on-esc` attribute to close with the Esc key.
 *
 * @element course-clear
 * @fire opened Once open animation finishes.
 * @fire closed Once closed.
 */
export class CourseClear extends HTMLElement {
  // So we can set props by index
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
   * The active animation. Used to cancel whatever step we're on.
   */
  private _active: CancelablePromise<void> | undefined;

  private _greetingEl = null as unknown as HTMLDivElement;
  private _childrenEl = null as unknown as HTMLDivElement;
  private _dialogEl = null as unknown as HTMLDialogElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render();
    if (this.open) this._closeOrRunAnimations();
  }

  disconnectedCallback() {
    this._cancelActive();
  }

  /**
   * Set to open and close the dialog. Reflects it current state.
   *
   * @attribute open
   * @type {boolean}
   * @default undefined.
   */
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

  /**
   * The short message to show when animating in.
   *
   * @attribute greeting
   * @type {string}
   * @default "Course Clear!"
   */
  get greeting() {
    return this.getAttribute("greeting")?.trim() || "Course Clear!";
  }

  set greeting(value: string) {
    this.setAttribute("greeting", value);
  }

  /**
   * Set this attribute to close the dialog when the Esc key is pressed. This will close
   * with an animation.
   *
   * @attribute close-on-esc
   * @type {boolean}
   */
  get closeOnEscape() {
    return this.hasAttribute("close-on-esc");
  }

  set closeOnEscape(value: boolean) {
    if (value) {
      this.setAttribute("close-on-esc", "");
    } else {
      this.removeAttribute("close-on-esc");
    }
  }

  /**
   * Set to close the dialog when clicking the backdrop.
   *
   * @attribute close-on-outside
   * @type {boolean}
   */
  get closeOnOutside() {
    return this.hasAttribute("close-on-outside");
  }

  set closeOnOutside(value: boolean) {
    if (value) {
      this.setAttribute("close-on-outside", "");
    } else {
      this.removeAttribute("close-on-outside");
    }
  }

  static get observedAttributes() {
    return ["open"];
  }

  attributeChangedCallback(name: string) {
    if (!this._dialogEl) return;

    switch (name) {
      case "open":
        this._closeOrRunAnimations();
        return;
    }
  }

  /**
   *
   * @returns The number of vertical bars to animate during the wave. Will be fewer on small
   * screens.
   */
  private _getBarCount() {
    return window.innerWidth > 768 ? 22 : 11;
  }

  /**
   * Start the vertical bar wave animation.
   *
   * @returns Promise that resolves when the animation is done. Can be canceled.
   */
  private _animateWave() {
    this._dialogEl.classList.remove("is-wave-finished");

    const bars: HTMLDivElement[] = [];

    const barCount = this._getBarCount();

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = "CourseClear__bar";
      bar.style.insetInlineStart = `calc(100% / ${barCount}  * ${i})`;
      bar.style.width = `calc(100% / ${barCount} + 1px)`;
      this._dialogEl.appendChild(bar);
      bars.push(bar);
    }

    const anims: Animation[] = [];

    let intervalId: ReturnType<typeof setTimeout>;

    const cleanup = once((isSuccess?: boolean) => {
      clearInterval(intervalId);
      anims.forEach((anim) => anim.finish());
      bars.forEach((bar) => bar.parentNode?.removeChild(bar));
      if (isSuccess) this._dialogEl?.classList.add("is-wave-finished");
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

  /**
   * Start the initial curtain animation from the top and bottom of the screen.
   *
   * @returns Promise that resolves when the animation is done. Can be canceled.
   */
  private _animateCurtains() {
    this._dialogEl.classList.remove("is-wave-finished", "is-curtains-finished");

    const top = document.createElement("div");
    top.className = "CourseClear__curtain CourseClear__curtain--top";
    const bottom = document.createElement("div");
    bottom.className = "CourseClear__curtain CourseClear__curtain--bottom";

    this._dialogEl.appendChild(top);
    this._dialogEl.appendChild(bottom);

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
          this._dialogEl.classList.add("is-curtains-finished");
          resolve();
        });
      })
    );
  }

  /**
   * Closes the dialog or runs the animations based the current value of the `open` attribute. If
   * you close during mid-animation, the close is instant. If the animations are complete, the
   * dialog will close with a fade out animation (i.e., normal close).
   */
  private async _closeOrRunAnimations() {
    if (!this._dialogEl) return;

    if (this.open) {
      this._dialogEl.style.display = "";
      this._dialogEl.showModal();
      await this._animateAll();
      this._dialogEl.dispatchEvent(OpenedEvent);
      return;
    }

    const closeCleanup = () => {
      this._dialogEl.style.display = "none";
      this._dialogEl.classList.remove("is-curtains-finished", "is-wave-finished");
      this._dialogEl.close();
    };

    if (this._active) {
      // If active, just abort
      this._cancelActive();
      closeCleanup();
    } else {
      // We're done animating and settled, so animate out too/
      // remove curtains class early to trigger backdrop transition
      this._dialogEl.classList.remove("is-curtains-finished");

      this._dialogEl
        .animate(
          [
            {
              opacity: 1,
              // translate: "0 0",
            },
            {
              opacity: 0,
              // translate: "0 -2rem",
            },
          ],
          {
            duration: 200,
          }
        )
        .finished.then(closeCleanup);
    }
  }

  /**
   * Starts and chanins all the animation to show the dialog. Assumes the modal is open already.
   */
  private async _animateAll() {
    this._cancelActive();
    this._dialogEl.style.display = "";

    this._greetingEl.textContent = this.greeting;
    this._greetingEl.style.display = "";

    this._dialogEl.classList.remove("is-curtains-finished", "is-wave-finished");

    this._active = this._animateCurtains();
    await this._active;
    this._active = this._animateWave();
    await this._active;
    this._active = undefined;
  }

  /**
   * Cancels the active animation, if there is one.
   */
  private _cancelActive() {
    if (this._active) this._active.cancel();
    this._active = undefined;
  }

  /**
   * Builds the DOM and connected events. Only call once.
   */
  private _render() {
    this.shadowRoot!.innerHTML = html`<dialog class="CourseClear" id="_dialogEl" style="display: none">
      <style>
        ${cssString}
      </style>
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

    this._dialogEl.addEventListener("cancel", (e) => {
      e.preventDefault();
      if (this.closeOnEscape) {
        this.open = false;
      }
    });

    this._dialogEl.addEventListener("close", () => {
      this._dialogEl.dispatchEvent(ClosedEvent);
    });

    this._dialogEl.addEventListener("click", (e: MouseEvent) => {
      if (!this._active && this.closeOnOutside && (e.target as HTMLDialogElement).nodeName === "DIALOG") {
        this.open = false;
      }
    });
  }
}

// XXX: this make hot module reload hard to impossible. Might want a debug flag to reload the whole
// page if this fails.s
customElements.define("course-clear", CourseClear);
