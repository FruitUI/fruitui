import { messages } from './messages.js';

export function mailDemo() {
  return {
    messages: structuredClone(messages),
    mailbox: 'inbox', query: '', unreadOnly: false, selectedId: 1,
    view: 'list', sidebarVisible: true, notice: '', noticeTimer: null,
    composeTo: '', composeSubject: '', composeBody: '',
    get mailboxTitle() { return { inbox: 'All Inboxes', flagged: 'Flagged', drafts: 'Drafts', sent: 'Sent', archive: 'Archive', trash: 'Trash', junk: 'Junk', work: 'Work', personal: 'Personal' }[this.mailbox]; },
    get filtered() {
      const query = this.query.trim().toLowerCase();
      return this.messages.filter(message => {
        const inMailbox = this.mailbox === 'flagged' ? message.flagged && !['trash', 'junk'].includes(message.mailbox) : message.mailbox === this.mailbox;
        return inMailbox && (!this.unreadOnly || message.unread) && (!query || [message.sender, message.subject, ...message.body].join(' ').toLowerCase().includes(query));
      });
    },
    get message() { return this.messages.find(message => message.id === this.selectedId) ?? null; },
    get unreadCount() { return this.messages.filter(message => message.mailbox === 'inbox' && message.unread).length; },
    count(mailbox) { return this.messages.filter(message => mailbox === 'flagged' ? message.flagged && !['trash', 'junk'].includes(message.mailbox) : message.mailbox === mailbox).length; },
    setMailbox(mailbox) { this.mailbox = mailbox; this.unreadOnly = false; this.query = ''; this.view = 'list'; this.syncSelection(); },
    syncSelection() { if (!this.filtered.some(message => message.id === this.selectedId)) this.selectedId = this.filtered[0]?.id ?? null; },
    select(id) { this.selectedId = id; this.message.unread = false; this.view = 'message'; },
    toggleFilter() { this.unreadOnly = !this.unreadOnly; this.syncSelection(); },
    move(destination) {
      if (!this.message) return;
      this.message.mailbox = destination;
      this.syncSelection();
      this.view = 'list';
      this.notify(destination === 'trash' ? 'Message moved to Trash' : 'Message archived');
    },
    toggleFlag() { if (this.message) { this.message.flagged = !this.message.flagged; if (this.mailbox === 'flagged') this.syncSelection(); } },
    compose(mode = 'new') {
      this.composeTo = mode === 'reply' ? this.message?.email ?? '' : '';
      this.composeSubject = mode === 'reply' ? `Re: ${this.message?.subject ?? ''}` : mode === 'forward' ? `Fwd: ${this.message?.subject ?? ''}` : '';
      this.composeBody = mode === 'forward' ? this.message?.body.join('\n\n') ?? '' : '';
      this.$refs.composer.showModal();
    },
    send() {
      this.messages.unshift({ id: Math.max(...this.messages.map(message => message.id)) + 1, sender: 'Alex Morgan', email: this.composeTo, initials: 'AM', subject: this.composeSubject.trim(), time: 'Just now', date: 'Just now', mailbox: 'sent', unread: false, flagged: false, preview: this.composeBody.trim(), body: this.composeBody.trim().split(/\n\s*\n/) });
      this.$refs.composer.close();
      this.notify('Demo message added to Sent');
    },
    notify(message) { clearTimeout(this.noticeTimer); this.notice = message; this.noticeTimer = setTimeout(() => { this.notice = ''; }, 3500); },
    destroy() { clearTimeout(this.noticeTimer); },
    moveSelection(direction) {
      const index = this.filtered.findIndex(message => message.id === this.selectedId);
      const next = this.filtered[index + direction];
      if (next) { this.select(next.id); this.$nextTick(() => this.$refs.messageList.querySelector(`[data-message-id="${next.id}"]`)?.focus()); }
    },
  };
}
