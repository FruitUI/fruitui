import Alpine from 'alpinejs';
import fruitUI from '../../src/js/alpine.js';
import { installIcons } from '../shared/icons.js';
import { tickets } from '../support/tickets.js';

// The chat window a website shows (widget/chat.html), from the visitor's side. Lena's earlier chat is
// the Support example's #1036, seen from her side: its replies, without the team's notes.
const lena = tickets.find(ticket => ticket.id === 1036);
const clock = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });
// The team's greeting, by the visitor's first name once the website signed them in.
const greet = (name = 'there') => ({
  id: 'greeting',
  kind: 'team',
  team: true,
  author: 'Forma',
  initials: 'F',
  body: `Hi ${name}. Ask us anything, we’re happy to help.`,
});
const greeting = greet();
const agent = { author: 'Alex Morgan', initials: 'AM' };
// Seen from Lena's side, Alex's answer about the Share menu comes with a screenshot of it.
const shareMenu = {
  id: 'share-menu',
  name: 'share-menu.png',
  size: '22 KB',
  url: '/attachments/share-menu.png',
  image: true,
};
// The launcher's name, and with answers that arrived while it was closed; Tallport translates both.
const launcher = 'Chat with Forma';
const unreadLauncher = count => `Chat with Forma, ${count} unread`;

function size(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function widgetChat() {
  const params = new URLSearchParams(location.search);
  // The website's origin, which the window answers to. Tallport serves the window only to the
  // widget's allowed websites; this demo serves any.
  const host = params.get('origin');
  let sequence = 0;
  const timers = new Set();
  const later = (callback, delay) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  };
  return {
    embedded: window.parent !== window && Boolean(host),
    // Shown: opened from the launcher, or the whole window on its own.
    shown: window.parent === window || !host,
    online: navigator.onLine,
    identity: null,
    email: '',
    entries: [greeting],
    draft: '',
    files: [],
    emailStep: 'address',
    emailDraft: '',
    emailError: '',
    codeDraft: '',
    codeError: '',
    codeNotice: '',
    codesSent: 0,
    busy: false,
    unread: 0,
    announcement: '',
    init() {
      addEventListener('message', event => {
        if (!this.embedded || event.source !== parent || event.origin !== host) return;
        const data = event.data;
        if (data?.tallport !== 1) return;
        if (data.type === 'open') this.opened(data.focus);
        else if (data.type === 'closed') this.shown = false;
        else if (data.type === 'identify') this.identify(data.token);
        else if (data.type === 'logout') this.logout();
        else if (data.type === 'appearance') this.appearance(data.value);
      });
      addEventListener('online', () => {
        this.online = true;
        for (const entry of this.entries) if (entry.state === 'waiting') this.deliver(entry);
      });
      addEventListener('offline', () => (this.online = false));
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.post('theme', this.colors()));
      // Not in an animation frame: browsers skip those in a hidden frame from another origin.
      this.$nextTick(() => this.post('ready', { label: launcher, available: true, ...this.colors() }));
    },
    destroy() {
      for (const timer of timers) clearTimeout(timer);
    },
    post(type, data = {}) {
      if (this.embedded) parent.postMessage({ tallport: 1, type, ...data }, host);
    },
    /** The launcher takes the window's accent and edge, so it matches in either appearance. */
    colors() {
      const probe = document.createElement('span');
      document.body.append(probe);
      const resolve = token => {
        probe.style.color = `var(${token})`;
        return getComputedStyle(probe).color;
      };
      const theme = document.documentElement.dataset.theme;
      const colors = {
        fill: resolve('--f-accent-fill'),
        fillHover: resolve('--f-accent-fill-hover'),
        canvas: resolve('--f-surface'),
        dark: theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches),
      };
      probe.remove();
      return colors;
    },
    appearance(value) {
      if (!['system', 'light', 'dark'].includes(value)) return;
      document.documentElement.dataset.theme = value;
      this.post('theme', this.colors());
    },
    get timeline() {
      const talks = entry => entry && (entry.kind === 'team' || entry.kind === 'visitor');
      const together = (one, other) =>
        talks(one) && talks(other) && one.kind === other.kind && one.author === other.author;
      return this.entries.map((entry, index) => ({
        ...entry,
        first: !together(entry, this.entries[index - 1]),
        last: !together(entry, this.entries[index + 1]),
      }));
    },
    /** The window opened: what arrived meanwhile is read, and when the visitor opened it, typing can start. */
    opened(focus) {
      this.shown = true;
      this.unread = 0;
      if (!focus) return;
      this.$nextTick(() => {
        if (matchMedia('(pointer: fine)').matches) this.$refs.message.focus();
        else this.$refs.title.focus();
      });
    },
    close() {
      this.post('close');
    },
    escape(event) {
      if (!this.embedded || event.defaultPrevented) return;
      event.preventDefault();
      this.close();
    },
    add(entry) {
      this.entries.push({ id: `entry-${++sequence}`, files: [], ...entry });
      return this.entries.at(-1);
    },
    addFiles(input) {
      for (const file of input.files)
        this.files.push({
          id: ++sequence,
          name: file.name,
          size: size(file.size),
          url: URL.createObjectURL(file),
          image: file.type.startsWith('image/'),
        });
      input.value = '';
      this.$refs.message.focus();
    },
    removeFile(file) {
      URL.revokeObjectURL(file.url);
      this.files = this.files.filter(item => item !== file);
      this.$refs.message.focus();
    },
    send() {
      const body = this.draft.trim();
      if (!body && !this.files.length) return;
      const first = !this.entries.some(entry => entry.kind === 'visitor');
      const entry = this.add({
        kind: 'visitor',
        author: 'You',
        body,
        files: this.files,
        time: clock.format(new Date()),
        state: 'sending',
      });
      this.draft = '';
      this.files = [];
      if (first && !this.identity && !this.email) this.add({ kind: 'email' });
      this.deliver(entry);
    },
    /** Sending takes a moment; offline, the message waits for the connection. */
    deliver(entry) {
      if (!this.online) return void (entry.state = 'waiting');
      entry.state = 'sending';
      later(() => {
        if (!this.online) return void (entry.state = 'waiting');
        entry.state = 'sent';
        this.answer();
      }, 500);
    },
    /** In this demo, Alex answers a moment after each message. */
    answer() {
      const name = this.identity?.name.split(' ')[0];
      const replies = this.entries.filter(entry => entry.kind === 'team' && !entry.team).length;
      const body = replies
        ? 'Thanks, that helps. I’ll check and get back to you here.'
        : `Hi${name ? ` ${name}` : ''}, Alex here. Thanks for your message, I’m looking into it now.`;
      later(() => this.receive({ ...agent, body }), 2500);
    },
    receive(message) {
      this.add({ kind: 'team', ...message, time: clock.format(new Date()) });
      if (this.shown) this.announcement = `${message.author}: ${message.body}`;
      else this.post('unread', { count: ++this.unread, label: unreadLauncher(this.unread) });
    },
    event(body) {
      return { kind: 'event', body };
    },
    /**
     * The website's server signed who the visitor is. What they already wrote here moves to their
     * account; with nothing written yet, their latest chat continues.
     */
    identify(token) {
      if (!token) return;
      this.identity = lena.customer;
      this.email = lena.customer.email;
      const written = this.entries.some(entry => entry.kind === 'visitor');
      const confirmed = this.event(`Replies also go to ${this.email}.`);
      const welcome = greet(this.identity.name.split(' ')[0]);
      if (written) {
        const card = this.entries.findIndex(entry => entry.kind === 'email');
        if (card >= 0) this.entries.splice(card, 1);
        this.entries.splice(0, 1, welcome, { id: `entry-${++sequence}`, ...confirmed });
        return;
      }
      this.entries = [welcome, { id: `entry-${++sequence}`, ...confirmed }];
      for (const thread of lena.threads)
        if (thread.kind === 'customer')
          this.add({ kind: 'visitor', author: 'You', body: thread.body, time: thread.time, state: 'sent' });
        else if (thread.kind === 'reply')
          this.add({
            kind: 'team',
            ...agent,
            body: thread.body,
            time: thread.time,
            files: thread.body.includes('Share menu') ? [shareMenu] : [],
          });
    },
    /** Signed out on the website: a new, anonymous visitor. */
    logout() {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      Object.assign(this, {
        identity: null,
        email: '',
        entries: [greeting],
        draft: '',
        files: [],
        emailStep: 'address',
        emailDraft: '',
        emailError: '',
        codeDraft: '',
        codeError: '',
        codeNotice: '',
        codesSent: 0,
        busy: false,
        unread: 0,
        announcement: '',
      });
      this.post('unread', { count: 0 });
    },
    sendCode() {
      const input = document.getElementById('widget-email');
      if (!this.emailDraft.trim() || !input.checkValidity()) {
        this.emailError = 'Enter an email address, like name@example.com.';
        input.focus();
        return;
      }
      this.busy = true;
      later(() => {
        this.busy = false;
        this.codesSent = 1;
        this.codeNotice = 'It can take a minute to arrive.';
        this.emailStep = 'code';
        this.$nextTick(() => document.getElementById('widget-code').focus());
      }, 600);
    },
    sendAgain() {
      this.codesSent++;
      this.codeNotice =
        this.codesSent >= 3 ? 'We sent a new code. You can ask for another one later.' : 'We sent a new code.';
      document.getElementById('widget-code').focus();
    },
    changeAddress() {
      this.emailStep = 'address';
      this.codeDraft = '';
      this.codeError = '';
      this.$nextTick(() => document.getElementById('widget-email').focus());
    },
    /** Only a confirmed address gets email: a mistyped one never receives the code. */
    confirmCode() {
      if (!/^\d{6}$/.test(this.codeDraft.trim())) {
        this.codeError = 'Enter the 6-digit code from the email.';
        document.getElementById('widget-code').focus();
        return;
      }
      this.busy = true;
      later(() => {
        this.busy = false;
        this.email = this.emailDraft.trim();
        const card = this.entries.findIndex(entry => entry.kind === 'email');
        this.entries.splice(card, 1, { id: `entry-${++sequence}`, ...this.event(`Replies also go to ${this.email}.`) });
        this.announcement = 'Email confirmed.';
        this.$refs.message.focus();
      }, 600);
    },
  };
}

installIcons();
fruitUI(Alpine);
Alpine.data('widgetChat', widgetChat);
Alpine.start();
