/*
 * The Settings example: grouped settings. One draft holds every
 * page's values; the save bar shows when it differs from what was saved, and Save validates natively.
 */
const pages = { general: 'General', mailbox: 'Support mailbox', profile: 'Profile' };
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
  accent: '#007aff',
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
    get title() {
      return this.page === 'mailbox' ? `${pages.mailbox} · ${mailboxTabs[this.tab]}` : pages[this.page];
    },
    get dirty() {
      return JSON.stringify(this.saved) !== JSON.stringify(this.draft);
    },
    init() {
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
    deleteAccount() {
      this.$refs.deleteDialog.close();
      this.$toast('Account deletion requested. Check your email to confirm.');
    },
  };
}
