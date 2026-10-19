/**
 * The Widget example: an example company's website in a browser frame, with the chat in its corner.
 * The page's appearance carries into the website, and the website passes it to the chat, as a
 * website with its own light and dark appearance would.
 */
export function widgetDemo() {
  let observer;
  return {
    init() {
      const site = this.$refs.site;
      const relay = () => {
        const page = site.contentWindow;
        if (!page?.document.documentElement) return;
        const theme = document.documentElement.dataset.theme || 'system';
        page.document.documentElement.dataset.theme = theme;
        page.tallport?.('appearance', theme);
      };
      observer = new MutationObserver(relay);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      site.addEventListener('load', relay);
      relay();
    },
    destroy() {
      observer?.disconnect();
    },
  };
}
