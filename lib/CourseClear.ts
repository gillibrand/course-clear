import cssString from "./course-clear-css.js";
import { html } from "./util.js";

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
function cancelable<T>(cancel: () => void, promise: Promise<T>) {
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
 * button. Optionally add the `close-on-esc` attribute to close with the Esc key.
 *
 * @element course-clear
 * @fire opened Once open animation finishes.
 * @fire closed Once closed.
 */
export class CourseClear extends HTMLElement {
  /**
   * The active animation. Used to cancel whatever step we're on.
   */
  private _active: CancelablePromise<void> | undefined;

  /**
   * The fade out animation while closing. Canceled if reopened before it finishes.
   */
  private _closeAnim: Animation | undefined;

  /**
   * Incremented on every open, close, and disconnect. Async steps compare against it to know if
   * they were superseded and should stop.
   */
  private _runId = 0;

  private _greetingEl = null as unknown as HTMLDivElement;
  private _childrenEl = null as unknown as HTMLDivElement;
  private _dialogEl = null as unknown as HTMLDialogElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Props set on the element before it was upgraded shadow our accessors. Reapply them.
    for (const prop of ["open", "greeting", "closeOnEscape", "closeOnOutside"] as const) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = this[prop];
        delete (this as Partial<this>)[prop];
        (this as Record<typeof prop, unknown>)[prop] = value;
      }
    }

    // Only render once. Reconnecting (e.g., moving the element) keeps the existing DOM.
    if (!this._dialogEl) this._render();
    if (this.open) this._closeOrRunAnimations();
  }

  disconnectedCallback() {
    this._runId++;
    this._cancelActive();
    this._closeAnim?.cancel();
    this._closeAnim = undefined;
    // Leave the `open` attribute alone so it reopens if reconnected.
    this._closeNow();
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

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (!this._dialogEl) return;

    switch (name) {
      case "open":
        // Ignore changes that don't toggle presence, e.g., `open = true` when already open
        if ((oldValue === null) === (newValue === null)) return;
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
   * @returns Promise that resolves when the animation is done or canceled.
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

    let intervalId: ReturnType<typeof setInterval>;
    let resolve: () => void;

    const cleanup = once((isSuccess?: boolean) => {
      clearInterval(intervalId);
      anims.forEach((anim) => anim.finish());
      bars.forEach((bar) => bar.remove());
      if (isSuccess) this._dialogEl.classList.add("is-wave-finished");
      resolve();
    });

    return cancelable(
      cleanup,
      new Promise<void>((res) => {
        resolve = res;
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
            // No-op if already canceled since cleanup runs once
            anim.finished.then(() => cleanup(true));
          }
        }, 30);
      })
    );
  }

  /**
   * Start the initial curtain animation from the top and bottom of the screen.
   *
   * @returns Promise that resolves when the animation is done or canceled.
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

    let resolve: () => void;

    const cleanup = once((isSuccess?: boolean) => {
      cancelAnimationFrame(frameID);
      top.remove();
      bottom.remove();
      if (isSuccess) this._dialogEl.classList.add("is-curtains-finished");
      resolve();
    });

    return cancelable(
      cleanup,
      new Promise<void>((res) => {
        resolve = res;
        bottom.addEventListener("transitionend", () => cleanup(true));
      })
    );
  }

  /**
   * Closes the dialog or runs the animations based the current value of the `open` attribute. If
   * you close during mid-animation, the close is instant. If the animations are complete, the
   * dialog will close with a fade out animation (i.e., normal close).
   */
  private async _closeOrRunAnimations() {
    if (!this._dialogEl || !this.isConnected) return;

    const runId = ++this._runId;

    // Stop any fade out in progress. Either we're reopening or about to close immediately.
    const closeAnim = this._closeAnim;
    this._closeAnim = undefined;
    closeAnim?.cancel();

    if (this.open) {
      this._dialogEl.style.display = "";
      if (!this._dialogEl.open) this._dialogEl.showModal();
      await this._animateAll();
      if (runId === this._runId) this._dispatch("opened");
      return;
    }

    if (this._active || !this._dialogEl.open) {
      // Mid-animation (or already closed natively), so just close immediately
      this._cancelActive();
      this._closeNow();
      return;
    }

    // We're done animating and settled, so animate out too.
    // Remove curtains class early to trigger backdrop transition.
    this._dialogEl.classList.remove("is-curtains-finished");

    const anim = this._dialogEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    this._closeAnim = anim;

    anim.finished.then(
      () => {
        if (this._closeAnim !== anim) return;
        this._closeAnim = undefined;
        this._closeNow();
      },
      // Canceled by a reopen or disconnect
      () => {}
    );
  }

  /**
   * Immediately hides the dialog and resets the animation state.
   */
  private _closeNow() {
    this._dialogEl.style.display = "none";
    this._dialogEl.classList.remove("is-curtains-finished", "is-wave-finished");
    if (this._dialogEl.open) this._dialogEl.close();
  }

  /**
   * Starts and chains all the animations to show the dialog. Assumes the modal is open already.
   * Resolves once done or canceled.
   */
  private async _animateAll() {
    const runId = this._runId;
    this._cancelActive();

    this._greetingEl.textContent = this.greeting;
    this._greetingEl.style.display = "";

    this._dialogEl.classList.remove("is-curtains-finished", "is-wave-finished");

    this._active = this._animateCurtains();
    await this._active;
    if (runId !== this._runId) return;

    this._active = this._animateWave();
    await this._active;
    if (runId !== this._runId) return;

    this._active = undefined;
  }

  /**
   * Cancels the active animation, if there is one.
   */
  private _cancelActive() {
    const active = this._active;
    this._active = undefined;
    active?.cancel();
  }

  /**
   * Dispatches an event from the host that bubbles out of any shadow roots.
   */
  private _dispatch(type: "opened" | "closed") {
    this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
  }

  /**
   * Builds the DOM and connected events. Only call once.
   */
  private _render() {
    const root = this.shadowRoot!;

    root.innerHTML = html`<dialog class="CourseClear" style="display: none">
      <style>
        ${cssString}
      </style>
      <div class="CourseClear__content">
        <div class="CourseClear__greeting"></div>
        <div class="CourseClear__children">
          <slot></slot>
        </div>
      </div>
    </dialog>`;

    this._dialogEl = root.querySelector(".CourseClear")!;
    this._greetingEl = root.querySelector(".CourseClear__greeting")!;
    this._childrenEl = root.querySelector(".CourseClear__children")!;

    // Events
    this._childrenEl.addEventListener("transitionend", (e) => {
      // Ignore transitions bubbling up from slotted content
      if (e.target !== this._childrenEl) return;
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
      // Browsers may ignore preventDefault on repeated cancel events and close anyway. Keep the
      // `open` attribute in sync if so.
      if (this.open && this.isConnected && !this._dialogEl.open) {
        this.open = false;
      }
      this._dispatch("closed");
    });

    this._dialogEl.addEventListener("click", (e: MouseEvent) => {
      if (!this._active && this.closeOnOutside && e.target === this._dialogEl) {
        this.open = false;
      }
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "course-clear": CourseClear;
  }
}

// Guard against double definition, e.g., if two copies of the library are loaded.
// XXX: this still makes hot module reload hard to impossible since the class can't be replaced.
if (!customElements.get("course-clear")) {
  customElements.define("course-clear", CourseClear);
}
