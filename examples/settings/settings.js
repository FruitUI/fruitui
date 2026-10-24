/*
 * The Settings example: grouped settings that drill down, level by level, in a Drill-Down. The URL
 * names the open levels (#/page/item/section). Every change is saved as it's made; an entry a field
 * can't take says why beside it.
 */
import { systemInfo, requirements, tasks, failedJobs, logs } from './system.js';
import {
  languages,
  mailboxPages,
  mailboxSettings,
  sampleMailboxes,
  aiSummary,
  checkField,
} from '../shared/mailbox-settings.js';

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
 * A person's account, under Users, holds what an administrator decides about it (role, sign-in,
 * permissions) and a row for each further page, with that page's current value; each opens as the
 * next level. What a person sets for themselves (profile, notifications) is under their own Profile
 * and Notifications, never under Users, also for the administrator's own. A mailbox's settings are
 * in the mailbox (the Support example), for whoever manages it; Mailboxes here creates and deletes.
 */
const userSections = { permissions: 'Permissions' };
/** What a person may do: General's “Users can” is the default, and a person's own choice wins. */
const permissions = {
  deleteConversations: 'Delete conversations',
  manageTags: 'Manage tags',
  manageFolders: 'Manage custom folders',
};
const roles = { admin: 'Administrator', user: 'User' };

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
  mailboxes: sampleMailboxes(),
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
    // The URL's levels: a page, then a person under Users, then one of their pages.
    page: 'profile',
    userId: null,
    section: '',
    // At Settings' root no page is chosen: the first, Profile, shows beside the list where there's room.
    chosen: false,
    settings: defaults(),
    pages,
    userSections,
    permissions,
    roles,
    languages,
    // The signed-in person, whose Profile this is.
    me: 'alex',
    // New Mailbox asks only for a name.
    newMailboxName: '',
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
    /** The open person, or the signed-in one on Profile. */
    get user() {
      return this.settings.users[this.userId];
    },
    get account() {
      return this.settings.users[this.me];
    },
    /** The open levels as a URL. */
    get path() {
      return ['#', this.page, this.userId, this.section].filter(Boolean).join('/');
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
    /** A mailbox's settings, in the mailbox (the Support example), at one of its pages. */
    mailboxUrl(id, page = '') {
      return `/support.html#/mailbox/${id}/settings${page ? `/${page}` : ''}`;
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
    /** A mailbox's AI Assistant at a glance, its Default following the installation's language. */
    aiSummary(box) {
      return aiSummary(box, this.settings.aiDefaultLanguage);
    },
    openNewMailbox() {
      this.newMailboxName = '';
      this.$refs.newMailboxDialog.showModal();
    },
    /**
     * A new mailbox with its name, then its settings in the mailbox. The Support example is another
     * page, so it's told about the new mailbox for this visit (sessionStorage), as a server would know.
     */
    createMailbox() {
      const name = this.newMailboxName.trim();
      const base =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'mailbox';
      let id = base;
      for (let number = 2; this.settings.mailboxes[id]; number++) id = `${base}-${number}`;
      this.settings.mailboxes[id] = mailboxSettings(name);
      this.$refs.newMailboxDialog.close();
      try {
        sessionStorage.setItem('fruitui-new-mailbox', JSON.stringify({ id, name }));
      } catch {
        // Without storage the Support example opens its own mailboxes.
      }
      location.assign(this.mailboxUrl(id));
    },
    async deleteMailbox(id) {
      const name = this.settings.mailboxes[id].name;
      const confirmed = await this.$confirm({
        title: `Delete ${name}?`,
        message: 'Its conversations are removed for everyone.',
        confirm: 'Delete Mailbox',
        tone: 'danger',
      });
      if (!confirmed) return;
      delete this.settings.mailboxes[id];
      this.$toast(`${name} was deleted.`);
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
      // A mailbox's settings moved into the mailbox: earlier links (and the single mailbox of earlier
      // versions, the Support mailbox's) open them there.
      if (page === 'mailbox') return location.replace(this.mailboxUrl('support', mailboxPages[id] ? id : ''));
      if (page === 'mailboxes' && this.settings.mailboxes[id]) {
        return location.replace(this.mailboxUrl(id, mailboxPages[section] ? section : ''));
      }
      this.chosen = Boolean(pages[page]);
      this.page = pages[page] ? page : 'profile';
      this.userId = this.page === 'users' && this.settings.users[id] ? id : null;
      this.section = this.userId && userSections[section] ? section : '';
    },
    /** An entry a field can't take says why beside it (examples/shared/mailbox-settings.js). */
    check(event) {
      checkField(event);
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
