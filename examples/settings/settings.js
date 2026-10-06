/*
 * The Settings example: grouped settings. One draft holds every
 * page's values; the save bar shows when it differs from what was saved, and Save validates natively.
 */
import { systemInfo, requirements, tasks, failedJobs, logs } from './system.js';

const pages = { general: 'General', mailbox: 'Support Mailbox', profile: 'Profile', status: 'Status', logs: 'Logs' };
const mailboxTabs = {
  general: 'General',
  connection: 'Connection',
  permissions: 'Permissions',
  'auto-reply': 'Auto reply',
};

const defaults = () => ({
  company: 'Forma',
  timezone: 'Europe/Amsterdam',
  dateFormat: 'long',
  photos: true,
  customerEmail: false,
  manageTags: true,
  manageFolders: false,
  deleteConversations: false,
  mailboxName: 'Support',
  mailboxEmail: 'support@forma.example',
  signature: 'Thanks,\nThe Forma team',
  sending: 'smtp',
  smtpHost: 'smtp.forma.example',
  smtpPort: 587,
  agents: ['alex', 'mia'],
  autoReply: false,
  autoSubject: 'We received your message',
  autoBody: 'Thanks for writing. We usually reply within a day.',
  name: 'Alex Morgan',
  email: 'alex@forma.example',
  language: 'en',
  accent: 'blue',
  twoFactor: true,
});

export function settingsDemo() {
  return {
    page: 'general',
    tab: 'general',
    // Compact layouts show the category list or one page.
    screen: 'list',
    saved: defaults(),
    draft: defaults(),
    pages,
    mailboxTabs,
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
    get systemPage() {
      return ['status', 'logs'].includes(this.page);
    },
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
    get title() {
      return this.page === 'mailbox' ? `${pages.mailbox} · ${mailboxTabs[this.tab]}` : pages[this.page];
    },
    get dirty() {
      return JSON.stringify(this.saved) !== JSON.stringify(this.draft);
    },
    init() {
      // The accent previews at once on the whole page; Revert restores the saved one.
      const accent = value => (document.documentElement.dataset.fruitAccent = value);
      accent(this.draft.accent);
      this.$watch('draft.accent', accent);
      this.route();
      window.addEventListener('hashchange', () => this.route());
    },
    route() {
      const [, page, tab] = location.hash.split('/');
      this.page = pages[page] ? page : 'general';
      this.tab = this.page === 'mailbox' && mailboxTabs[tab] ? tab : 'general';
    },
    show() {
      this.screen = 'page';
      this.$nextTick(() => this.$refs.pageTitle.focus({ preventScroll: true }));
    },
    back() {
      this.screen = 'list';
      this.$nextTick(() => this.$refs.navigation.querySelector('[aria-current="page"]')?.focus());
    },
    save() {
      // Enter in a field submits too; with nothing changed there is nothing to save.
      if (!this.dirty || !this.$refs.form.reportValidity()) return;
      this.saved = JSON.parse(JSON.stringify(this.draft));
      this.$toast('Settings saved.');
    },
    revert() {
      this.draft = JSON.parse(JSON.stringify(this.saved));
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
