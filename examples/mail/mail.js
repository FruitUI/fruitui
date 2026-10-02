import { messages, accounts, folders } from './messages.js';

export function mailDemo() {
  return {
    messages: structuredClone(messages), accounts, folders,
    accountId: 'all', mailbox: 'inbox', query: '', unreadOnly: false, selectedId: 1,
    view: 'list', preview: 'responsive', sidebarVisible: true, notice: '', noticeTimer: null,
    composeAccountId: 'work', composeTo: '', composeCc: '', composeBcc: '', composeSubject: '', composeBody: '',
    account(id) { return this.accounts.find(account => account.id === id); },
    get mailboxTitle() {
      const folder = this.folders.find(folder => folder.id === this.mailbox)?.label;
      return this.accountId === 'all' ? (this.mailbox === 'inbox' ? 'All Inboxes' : folder) : `${this.account(this.accountId).name} ${folder}`;
    },
    get navigationValue() { return this.accountId === 'all' ? this.mailbox : `${this.accountId}:${this.mailbox}`; },
    matchesScope(message, accountId) { return accountId === 'all' || message.accountId === accountId; },
    matchesFolder(message, mailbox) { return mailbox === 'flagged' ? message.flagged && !['trash', 'junk'].includes(message.mailbox) : message.mailbox === mailbox; },
    get filtered() {
      const query = this.query.trim().toLowerCase();
      return this.messages.filter(message => {
        return this.matchesScope(message, this.accountId) && this.matchesFolder(message, this.mailbox)
          && (!this.unreadOnly || message.unread) && (!query || [message.sender, message.email, message.subject, ...message.body].join(' ').toLowerCase().includes(query));
      });
    },
    get message() { return this.messages.find(message => message.id === this.selectedId) ?? null; },
    get messageIndex() { return this.filtered.findIndex(message => message.id === this.selectedId); },
    get unreadCount() { return this.unreadFor(this.accountId); },
    unreadFor(accountId = 'all') { return this.messages.filter(message => this.matchesScope(message, accountId) && message.mailbox === 'inbox' && message.unread).length; },
    count(mailbox, accountId = 'all') { return this.messages.filter(message => this.matchesScope(message, accountId) && this.matchesFolder(message, mailbox)).length; },
    setMailbox(mailbox, accountId = 'all') {
      if (!this.folders.some(folder => folder.id === mailbox) || (accountId !== 'all' && !this.account(accountId))) return;
      this.accountId = accountId; this.mailbox = mailbox; this.unreadOnly = false; this.query = ''; this.syncSelection(); this.backToList();
      this.$nextTick(() => this.revealAccount());
    },
    revealAccount() {
      const group = this.$refs.mailboxes.querySelector(`[data-scope="${this.accountId}"]`);
      if (group) group.open = true;
    },
    setNavigation(value) { const parts = value.split(':'); this.setMailbox(parts.at(-1), parts.length === 2 ? parts[0] : 'all'); },
    syncSelection() { if (!this.filtered.some(message => message.id === this.selectedId)) this.selectedId = this.filtered[0]?.id ?? null; },
    select(id) {
      const refs = this.$refs;
      this.selectedId = id;
      this.message.unread = false;
      this.view = 'message';
      this.$nextTick(() => { if (refs.mobileHeader.getClientRects().length) refs.mobileBack.focus(); });
    },
    showMailboxes() {
      this.view = 'mailboxes';
      this.$nextTick(() => {
        this.revealAccount();
        this.$refs.mobileTitle.focus();
      });
    },
    backToList() {
      const refs = this.$refs;
      this.view = 'list';
      this.$nextTick(() => {
        if (refs.mobileHeader.getClientRects().length) {
          const item = refs.messageList.querySelector(`[data-message-id="${this.selectedId}"]`) ?? refs.messageList.querySelector('.f-mail__message');
          item?.focus();
        }
      });
    },
    markAllRead() {
      const visible = this.filtered;
      visible.forEach(message => { message.unread = false; });
      this.syncSelection();
      this.notify('Messages marked as read');
    },
    toggleFilter() { this.unreadOnly = !this.unreadOnly; this.syncSelection(); },
    move(destination) {
      if (!this.message) return;
      this.message.mailbox = destination;
      this.syncSelection();
      this.backToList();
      this.notify(destination === 'trash' ? 'Message moved to Trash' : 'Message archived');
    },
    toggleFlag() { if (this.message) { this.message.flagged = !this.message.flagged; if (this.mailbox === 'flagged') this.syncSelection(); } },
    validateRecipient(event) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.detail.value)) { event.detail.error = 'Enter an email address.'; event.preventDefault(); }
    },
    compose(mode = 'new') {
      this.composeCc = ''; this.composeBcc = '';
      this.composeAccountId = mode !== 'new' && this.message ? this.message.accountId : this.accountId === 'all' ? this.accounts[0].id : this.accountId;
      this.composeTo = mode === 'reply' ? this.message?.email ?? '' : '';
      this.composeSubject = mode === 'reply' ? `Re: ${this.message?.subject ?? ''}` : mode === 'forward' ? `Fwd: ${this.message?.subject ?? ''}` : '';
      this.composeBody = mode === 'forward' ? this.message?.body.join('\n\n') ?? '' : '';
      this.$nextTick(() => this.$refs.composer.querySelectorAll('.f-token-field textarea').forEach(control => control.dispatchEvent(new Event('fruit-token-reset'))));
      this.$refs.composer.showModal();
    },
    send() {
      if (!this.account(this.composeAccountId)) return;
      if (!this.composeBody.trim()) { this.notify('Please write a message.'); return; }
      this.messages.unshift({ id: Math.max(...this.messages.map(message => message.id)) + 1, accountId: this.composeAccountId, sender: 'Alex Morgan', email: this.composeTo, cc: this.composeCc, bcc: this.composeBcc, initials: 'AM', subject: this.composeSubject.trim(), time: 'Just now', date: 'Just now', mailbox: 'sent', unread: false, flagged: false, preview: this.composeBody.trim(), body: this.composeBody.trim().split(/\n\s*\n/) });
      this.$refs.composer.close();
      this.notify('Demo message added to Sent');
    },
    notify(message) { clearTimeout(this.noticeTimer); this.notice = message; this.noticeTimer = setTimeout(() => { this.notice = ''; }, 3500); },
    destroy() { clearTimeout(this.noticeTimer); },
    moveSelection(direction) {
      const index = this.filtered.findIndex(message => message.id === this.selectedId);
      const next = this.filtered[index + direction];
      if (next) {
        this.selectedId = next.id;
        next.unread = false;
        this.view = 'message';
        this.$nextTick(() => { if (this.$refs.messageList.getClientRects().length) this.$refs.messageList.querySelector(`[data-message-id="${next.id}"]`)?.focus(); });
      }
    },
  };
}
