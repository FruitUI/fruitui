const paths = {
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M6 8h0M6 12h0"/>',
  inbox: '<path d="m4 4-2 10v6h20v-6L20 4H4Z"/><path d="M2 14h6l2 3h4l2-3h6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  flag: '<path d="M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  send: '<path d="m22 2-7 20-4-9-9-4L22 2ZM22 2 11 13"/>',
  file: '<path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5M8 12h8M8 16h5"/>',
  archive: '<rect x="3" y="3" width="18" height="4" rx="1"/><path d="M4 7v14h16V7M9 11h6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  junk: '<path d="m8 2-6 6v8l6 6h8l6-6V8l-6-6H8ZM12 7v6M12 17h0"/>',
  folder: '<path d="M3 5h6l2 3h10v13H3V5Z"/>',
  compose: '<path d="M12 4H4v16h16v-8M10 14l1-4L19 2l3 3-8 8-4 1Z"/>',
  reply: '<path d="m9 5-7 6 7 6v-4c7 0 11 2 13 7-1-10-5-13-13-13V5Z"/>',
  forward: '<path d="m15 5 7 6-7 6v-4c-7 0-11 2-13 7C3 10 7 7 15 7V5Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  'filter-circle': '<circle cx="12" cy="12" r="9"/><path d="M7 9h10M9 13h6M11 17h2"/>',
  envelope: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  more: '<circle cx="12" cy="12" r="9"/><path d="M7 12h.01M12 12h.01M17 12h.01"/>',
  up: '<path d="m5 15 7-7 7 7"/>',
  down: '<path d="m5 9 7 7 7-7"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  tray: '<path d="M3 5h18v14H3V5ZM3 13h5l2 3h4l2-3h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  chat: '<path d="M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-8l-6 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM7 8h10M7 12h7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
};

export function installIcons() {
  const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.display = 'none';
  sprite.innerHTML = Object.entries(paths).map(([name, path]) => `<symbol id="i-${name}" viewBox="0 0 24 24">${path}</symbol>`).join('');
  document.body.prepend(sprite);
}
