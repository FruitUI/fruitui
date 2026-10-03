export function appearance() {
  return {
    theme: 'system',
    init() {
      try {
        const value = localStorage.getItem('fruitui.appearance');
        if (['light', 'dark', 'system'].includes(value)) this.theme = value;
      } catch {
        /* Storage may be unavailable in a private or embedded context. */
      }
      this.apply();
    },
    apply() {
      document.documentElement.dataset.theme = this.theme;
      try {
        localStorage.setItem('fruitui.appearance', this.theme);
      } catch {
        /* Optional persistence. */
      }
    },
  };
}
