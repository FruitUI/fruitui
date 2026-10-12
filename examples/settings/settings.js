/*
 * The Settings example: grouped settings that drill down, level by level, in a Drill-Down. The URL
 * names the open levels (#/page/item/section). Every change is saved as it's made; an entry a field
 * can't take says why beside it.
 */
import { systemInfo, requirements, tasks, failedJobs, logs } from './system.js';
import { Marked } from 'marked';

/**
 * Signatures and automatic replies are written in Markdown and shown as customers will see them, as a
 * server renders them: a single line break is a line break, raw HTML shows as text, and only web and
 * mail addresses become links.
 */
const escape = text => text.replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);
const markdown = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html: ({ text }) => escape(text),
    link(token) {
      return /^(https?:|mailto:)/i.test(token.href) ? false : this.parser.parseInline(token.tokens);
    },
    image: ({ href, text }) => (/^https?:/i.test(href) ? false : escape(text)),
  },
});

// Your own pages first (Profile, Notifications), then the team's settings, then managing it.
const pages = {
  profile: 'Profile',
  notifications: 'Notifications',
  general: 'General',
  mailboxes: 'Mailboxes',
  ai: 'AI Assistant',
  users: 'Users',
  status: 'Status',
  logs: 'Logs',
};
/**
 * A mailbox's settings live in one place: Settings › Mailboxes › the mailbox. Its page holds the
 * everyday settings and a row for each further page, with that page's current value; each opens as
 * the next level. A person's account works the same way, under Users: what an administrator decides
 * about it (role, sign-in, permissions). What a person sets for themselves (profile, notifications)
 * is under their own Profile and Notifications, never under Users, also for the administrator's own.
 */
const mailboxSections = {
  connection: 'Connection',
  permissions: 'Permissions',
  'auto-reply': 'Auto Reply',
  ai: 'AI Assistant',
};
const userSections = { permissions: 'Permissions' };
/** What a person may do: General's “Users can” is the default, and a person's own choice wins. */
const permissions = {
  deleteConversations: 'Delete conversations',
  manageTags: 'Manage tags',
  manageFolders: 'Manage custom folders',
};
const roles = { admin: 'Administrator', user: 'User' };
const languages = {
  default: 'Default',
  en: 'English',
  nl: 'Dutch',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  ja: 'Japanese',
};

const mailbox = (name, email, color, details = {}) => ({
  name,
  email,
  color,
  signature: 'Thanks,\n**The Forma team**\n[forma.example](https://forma.example)',
  sending: 'smtp',
  smtpHost: 'smtp.forma.example',
  smtpPort: 587,
  agents: ['alex', 'mia'],
  autoReply: false,
  autoSubject: 'We received your message',
  autoBody: 'Hi {%customer.first_name%},\n\nThanks for writing. We usually reply **within a day**.',
  // The AI Assistant for this mailbox; providers and limits are installation-wide (Settings › AI Assistant).
  aiLanguage: 'default',
  aiSummaries: true,
  aiTranslations: true,
  aiDrafts: true,
  chatTranslation: false,
  markTranslated: true,
  aiGlossary: '',
  contextUrl: '',
  contextKey: '',
  contextHeader: 'none',
  replyGuidance: '',
  ...details,
});

const person = (name, email, role, details = {}) => ({
  name,
  email,
  role,
  canSignIn: true,
  permissions: { deleteConversations: 'default', manageTags: 'default', manageFolders: 'default' },
  notifyNew: true,
  notifyReplies: true,
  notifyMentions: true,
  notifyBrowser: false,
  ...details,
});

const defaults = () => ({
  company: 'Forma',
  timezone: 'Europe/Amsterdam',
  dateFormat: 'long',
  photos: true,
  customerEmail: false,
  manageTags: true,
  manageFolders: false,
  deleteConversations: false,
  mailboxes: {
    support: mailbox('Support', 'support@forma.example', 'blue'),
    billing: mailbox('Billing', 'billing@forma.example', 'green', {
      agents: ['alex'],
      autoReply: true,
      aiLanguage: 'nl',
      chatTranslation: true,
    }),
    feedback: mailbox('Feedback', 'feedback@forma.example', 'purple', {
      sending: 'php',
      agents: ['alex', 'mia', 'noah'],
      aiSummaries: false,
      aiTranslations: false,
      aiDrafts: false,
    }),
  },
  users: {
    alex: person('Alex Morgan', 'alex@forma.example', 'admin'),
    mia: person('Mia Patel', 'mia@forma.example', 'user', { notifyBrowser: true }),
    noah: person('Noah Williams', 'noah@forma.example', 'user', {
      permissions: { deleteConversations: 'allow', manageTags: 'deny', manageFolders: 'default' },
      notifyMentions: false,
    }),
  },
  aiDefaultLanguage: 'en',
  aiDailyTokens: 200000,
  language: 'en',
  accent: 'blue',
  twoFactor: true,
});

export function settingsDemo() {
  return {
    // The URL's levels: a page, then an item under it (a mailbox or a person), then one of its pages.
    page: 'profile',
    mailboxId: null,
    userId: null,
    section: '',
    // At Settings' root no page is chosen: the first, Profile, shows beside the list where there's room.
    chosen: false,
    settings: defaults(),
    pages,
    mailboxSections,
    userSections,
    permissions,
    roles,
    languages,
    // The signed-in person, whose Profile this is.
    me: 'alex',
    // Customer Context's test: not a setting.
    contextEmail: '',
    contextResult: '',
    // System: Status reports problems with their fixes; Logs shows what happened.
    systemInfo,
    requirements,
    tasks,
    failedJobs: structuredClone(failedJobs),
    logs: structuredClone(logs),
    migrationsPending: true,
    fetchRunning: false,
    fetchDays: 3,
    fetchScope: 'unread',
    fetchDebug: false,
    fetchOutput: '',
    fetching: false,
    logName: 'outgoing',
    logEntry: null,
    logFile: 'laravel.log',
    logQuery: '',
    /** What needs attention, each with the fix where the problem is reported. */
    get problems() {
      return [
        this.migrationsPending && {
          id: 'database',
          text: 'Database updates are waiting',
          detail: 'Run them now, before people notice slow or failing pages.',
          action: 'Update Database',
          run: () => this.updateDatabase(),
        },
        !this.fetchRunning && {
          id: 'fetch',
          text: 'Fetch Emails hasn’t run for 3 hours',
          detail: 'The server’s scheduled task (cron) isn’t calling Forma. Add this line to its crontab:',
          command: '* * * * * php /var/www/forma/artisan schedule:run >> /dev/null 2>&1',
          action: 'Check Again',
          run: () => this.checkFetch(),
        },
        this.failedJobs.length && {
          id: 'jobs',
          text: `${this.failedJobs.length} ${this.failedJobs.length === 1 ? 'job' : 'jobs'} failed`,
          detail: 'Emails that couldn’t be sent, listed under Failed Jobs.',
          action: 'Retry All',
          run: () => this.retryAllJobs(),
        },
      ].filter(Boolean);
    },
    taskStatus(task) {
      if (task.id === 'fetch') return this.fetchRunning ? 'Last ran 1 minute ago' : 'Hasn’t run for 3 hours';
      return task.lastRun;
    },
    get currentLog() {
      return this.logs[this.logName];
    },
    get logLines() {
      const query = this.logQuery.trim().toLowerCase();
      return (this.logs.app.files[this.logFile] ?? []).filter(line => !query || line.toLowerCase().includes(query));
    },
    /** The open mailbox, which its fields edit. */
    get box() {
      return this.settings.mailboxes[this.mailboxId];
    },
    /** The open person, or the signed-in one on Profile. */
    get user() {
      return this.settings.users[this.userId];
    },
    get account() {
      return this.settings.users[this.me];
    },
    /** The open levels as a URL. */
    get path() {
      return ['#', this.page, this.mailboxId ?? this.userId, this.section].filter(Boolean).join('/');
    },
    /** A row leading to the open path is current: the deepest one as the page, the ones above it on the way. */
    current(href) {
      if (href === this.path) return 'page';
      return this.path.startsWith(`${href}/`) ? 'true' : null;
    },
    initials(name) {
      return (
        name
          .split(/\s+/)
          .filter(Boolean)
          .map(part => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || '?'
      );
    },
    /** Markdown as customers will see it. */
    asSent(text) {
      return markdown.parse(text ?? '');
    },
    people(box) {
      return box.agents.length === 1 ? '1 person' : `${box.agents.length} people`;
    },
    /** The mailboxes a person can use: each mailbox's own list of people. */
    mailboxesOf(id) {
      return Object.keys(this.settings.mailboxes).filter(key => this.settings.mailboxes[key].agents.includes(id));
    },
    toggleMailbox(key, id, on) {
      const box = this.settings.mailboxes[key];
      box.agents = on ? [...new Set([...box.agents, id])] : box.agents.filter(agent => agent !== id);
    },
    /** A permission's Default names what General's “Users can” currently allows. */
    defaultLabel(permission) {
      return `Default (${this.settings[permission] ? 'Allowed' : 'Not Allowed'})`;
    },
    /** The current value a person's level shows for their Permissions. */
    userSummary() {
      const count = this.mailboxesOf(this.userId).length;
      return count === 1 ? '1 mailbox' : `${count} mailboxes`;
    },
    /** The administrator's own account, under Users: what would lock them out isn't theirs to change. */
    get isMe() {
      return this.userId === this.me;
    },
    /** The installation's default language is a real language, not Default. */
    get installationLanguages() {
      return Object.fromEntries(Object.entries(languages).filter(([code]) => code !== 'default'));
    },
    /** A mailbox's AI Assistant at a glance: its language while any feature is on. */
    aiSummary(box) {
      if (![box.aiSummaries, box.aiTranslations, box.aiDrafts, box.chatTranslation].some(Boolean)) return 'Off';
      return `On · ${languages[box.aiLanguage === 'default' ? this.settings.aiDefaultLanguage : box.aiLanguage]}`;
    },
    /** The current value a mailbox's page row shows for one of its further pages. */
    summary(section) {
      const box = this.box;
      if (section === 'connection') return box.sending === 'smtp' ? `SMTP · ${box.smtpHost}` : 'The server’s mail';
      if (section === 'permissions') return this.people(box);
      if (section === 'ai') return this.aiSummary(box);
      return box.autoReply ? 'On' : 'Off';
    },
    /** Asks the Customer Context URL about one customer and shows the answer, as the assistant would. */
    testContext() {
      const input = this.$root.querySelector('#settings-ai-test');
      // The message stays until the field changes or loses focus.
      input.setCustomValidity(this.contextEmail ? '' : 'Enter a customer’s email address.');
      if (!input.reportValidity()) return;
      this.contextResult = JSON.stringify(
        {
          email: this.contextEmail,
          name: 'Sophie Chen',
          company: 'Studio North',
          plan: 'Team',
          customerSince: '2024-03',
        },
        null,
        2,
      );
    },
    init() {
      // The accent applies at once, on the whole page.
      const accent = value => (document.documentElement.dataset.fruitAccent = value);
      accent(this.settings.accent);
      this.$watch('settings.accent', accent);
      this.route();
      // fruitDrilldown keeps focus in view as the levels change.
      window.addEventListener('hashchange', () => this.route());
    },
    route() {
      const [, page, id, section] = location.hash.split('/');
      // Links to the single mailbox of earlier versions open the Support mailbox.
      if (page === 'mailbox') return location.replace(`#/mailboxes/support${mailboxSections[id] ? `/${id}` : ''}`);
      this.chosen = Boolean(pages[page]);
      this.page = pages[page] ? page : 'profile';
      this.mailboxId = this.page === 'mailboxes' && this.settings.mailboxes[id] ? id : null;
      this.userId = this.page === 'users' && this.settings.users[id] ? id : null;
      const sections = this.mailboxId ? mailboxSections : this.userId ? userSections : {};
      this.section = sections[section] ? section : '';
    },
    /**
     * Changes are saved as they're made, so there's nothing to submit. A field that can't take an entry
     * says why beside it when it's committed (on leaving a text field), until it's corrected.
     */
    check(event) {
      const control = event.target;
      const field = control.closest?.('.f-field');
      if (!control.willValidate || !control.id || !field) return;
      const id = `${control.id}-error`;
      let error = document.getElementById(id);
      // While typing, a shown message follows the entry; a new one waits for the change.
      if (event.type === 'input' && !error) return;
      const described = (control.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter(token => token && token !== id);
      if (control.checkValidity()) {
        error?.remove();
        control.removeAttribute('aria-invalid');
      } else {
        error ??= field.appendChild(Object.assign(document.createElement('p'), { className: 'f-error', id }));
        error.textContent = control.validationMessage;
        control.setAttribute('aria-invalid', 'true');
        described.push(id);
      }
      if (described.length) control.setAttribute('aria-describedby', described.join(' '));
      else control.removeAttribute('aria-describedby');
    },
    updateDatabase() {
      this.migrationsPending = false;
      this.$toast('The database is up to date.');
    },
    checkFetch() {
      this.fetchRunning = true;
      this.$toast('Fetch Emails is running again.');
    },
    retryJob(id) {
      this.failedJobs = this.failedJobs.filter(job => job.id !== id);
      this.$toast('Job queued again.');
    },
    retryAllJobs() {
      const count = this.failedJobs.length;
      this.failedJobs = [];
      this.$toast(`${count} ${count === 1 ? 'job' : 'jobs'} queued again.`);
    },
    clearCache() {
      this.$toast('Cache cleared.');
    },
    async signOutEveryone() {
      const confirmed = await this.$confirm({
        title: 'Sign out everyone?',
        message: 'Everyone, including you, will need to sign in again.',
        confirm: 'Sign Out Everyone',
        tone: 'danger',
      });
      if (confirmed) this.$toast('Everyone was signed out.');
    },
    resetPassword() {
      this.$toast(`A link to choose a new password is on its way to ${this.user.email}.`);
    },
    async removeUser() {
      const confirmed = await this.$confirm({
        title: `Remove ${this.user.name}?`,
        message: 'Their conversations stay with your team.',
        confirm: 'Remove',
        tone: 'danger',
      });
      if (confirmed) this.$toast('This sample person stays.');
    },
    openFetch() {
      this.fetchOutput = '';
      this.$refs.fetchDialog.showModal();
    },
    runFetch() {
      if (!this.$refs.fetchForm.reportValidity()) return;
      this.fetching = true;
      setTimeout(() => {
        const scope = this.fetchScope === 'unread' ? 'unread' : 'all';
        this.fetchOutput = [
          `Fetching ${scope} emails from the last ${this.fetchDays} ${Number(this.fetchDays) === 1 ? 'day' : 'days'}…`,
          ...(this.fetchDebug
            ? ['[debug] Connecting to imap.forma.example:993 (SSL)', '[debug] Selected INBOX: 14 messages']
            : []),
          'support@forma.example: 2 new messages',
          'billing@forma.example: no new messages',
          'Done in 1.4 seconds.',
        ].join('\n');
        this.fetching = false;
        this.fetchRunning = true;
      }, 500);
    },
    showLogEntry(entry) {
      this.logEntry = entry;
      this.$nextTick(() => this.$refs.logDialog.showModal());
    },
    async clearLog() {
      const label = this.logName === 'app' ? this.logFile : this.currentLog.label;
      const confirmed = await this.$confirm({
        title: `Clear ${label}?`,
        message: 'Its entries are deleted for good.',
        confirm: 'Clear Log',
        tone: 'danger',
      });
      if (!confirmed) return;
      if (this.logName === 'app') this.logs.app.files[this.logFile] = [];
      else this.currentLog.entries = [];
      this.$toast(`${label} cleared.`);
    },
    deleteAccount() {
      this.$refs.deleteDialog.close();
      this.$toast('Account deletion requested. Check your email to confirm.');
    },
  };
}
