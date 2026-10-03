/** Compose into application data, or register as an independent fruitToast scope. */
export function fruitToast({ duration = 4000, message = null } = {}) {
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error('FruitUI Toast duration must be a nonnegative number of milliseconds.');
  let timer,
    started,
    remaining = duration;
  const clear = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  return {
    notice: '',
    // Only an initial message adds init, so spreading the factory keeps an application's own init.
    ...(message
      ? {
          init() {
            this.notify(message);
          },
        }
      : {}),
    notify(message) {
      clear();
      this.notice = String(message);
      remaining = duration;
      this.resumeNotice();
    },
    dismissNotice() {
      clear();
      this.notice = '';
      remaining = 0;
    },
    pauseNotice() {
      if (timer !== undefined) {
        remaining = Math.max(0, remaining - (performance.now() - started));
        clear();
      }
    },
    resumeNotice() {
      if (!this.notice || !duration || timer !== undefined) return;
      started = performance.now();
      timer = setTimeout(() => this.dismissNotice(), remaining);
    },
    destroyToast() {
      clear();
    },
    destroy() {
      this.destroyToast();
    },
  };
}
