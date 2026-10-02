import { fruitToast } from '../../src/js/toast.js';
import { tickets, queues, agents, mailboxes } from './tickets.js';

export function supportDemo() {
  return {
    ...fruitToast(),
    tickets: structuredClone(tickets), queues, agents, mailboxes,
    mailboxId: 'all', queue: 'open', query: '', priorityOnly: false, selectedId: 1042,
    page: 1, pageSize: 10, view: 'list', mode: 'reply', tagInput: '', error: '',
    drafts: { 1042: { reply: 'Hi Sophie,\n\nAbsolutely — all your projects and comments will stay right where they are. You can upgrade from Settings → Billing and invite your teammates whenever you’re ready.\n\nAnnual billing is available, too. Happy to help you get the studio settled in!\n\nAlex', note: '' } },
    newMailboxId: 'support', newName: '', newEmail: '', newSubject: '', newMessage: '', newError: '',
    mailbox(id) { return this.mailboxes.find(mailbox => mailbox.id === id); },
    get queueTitle() {
      const label = this.queues.find(queue => queue.id === this.queue)?.label;
      return this.mailboxId === 'all' ? (this.queue === 'open' ? 'All Inboxes' : label) : `${this.mailbox(this.mailboxId).name} · ${label}`;
    },
    get scopeDescription() { return this.mailboxId === 'all' ? `${this.mailboxes.length} mailboxes` : this.mailbox(this.mailboxId).email; },
    matchesScope(ticket, mailboxId) { return mailboxId === 'all' || ticket.mailboxId === mailboxId; },
    matchesQueue(ticket, queue) {
      return queue === 'mine' ? ticket.status !== 'closed' && ticket.assignee === 'alex'
        : queue === 'unassigned' ? ticket.status !== 'closed' && !ticket.assignee
        : ticket.status === queue;
    },
    count(queue, mailboxId = 'all') { return this.tickets.filter(ticket => this.matchesScope(ticket, mailboxId) && this.matchesQueue(ticket, queue)).length; },
    get filtered() {
      const query = this.query.trim().toLowerCase();
      return this.tickets.filter(ticket => this.matchesScope(ticket, this.mailboxId) && this.matchesQueue(ticket, this.queue)
        && (!this.priorityOnly || ['high', 'urgent'].includes(ticket.priority))
        && (!query || [ticket.id, ticket.customer.name, ticket.customer.email, ticket.subject, ...ticket.tags, ...ticket.threads.map(thread => thread.body)].join(' ').toLowerCase().includes(query)))
        .sort((a, b) => b.id - a.id);
    },
    get pageCount() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); },
    get paged() { return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); },
    changePage(page) { this.page = Math.max(1, Math.min(page, this.pageCount)); if (this.paged[0]) this.select(this.paged[0].id, false); },
    get assigneeValue() { return this.ticket?.assignee ?? ''; },
    set assigneeValue(value) { if (this.ticket && value !== this.ticket.assignee) this.assign(value); },
    sendAndClose() { if (this.mode !== 'reply' || !this.draft.trim()) return; this.send(); this.updateStatus('closed'); },
    get ticket() { return this.tickets.find(ticket => ticket.id === this.selectedId) ?? null; },
    get related() { return this.ticket ? this.tickets.filter(ticket => ticket.customer.email === this.ticket.customer.email && ticket.id !== this.ticket.id) : []; },
    get customerConversationCount() { return this.ticket ? this.related.length + 1 : 0; },
    get draft() { return this.drafts[this.selectedId]?.[this.mode] ?? ''; },
    set draft(value) {
      if (this.selectedId === null) return;
      this.drafts[this.selectedId] ??= { reply: '', note: '' };
      this.drafts[this.selectedId][this.mode] = value;
      this.error = '';
    },
    syncSelection() {
      if (!this.filtered.some(ticket => ticket.id === this.selectedId)) this.selectedId = this.filtered[0]?.id ?? null;
      this.page = Math.max(1, Math.floor(this.filtered.findIndex(ticket => ticket.id === this.selectedId) / this.pageSize) + 1);
      this.tagInput = ''; this.error = '';
    },
    setQueue(queue, mailboxId = 'all') {
      if (!this.queues.some(item => item.id === queue) || (mailboxId !== 'all' && !this.mailbox(mailboxId))) return;
      this.mailboxId = mailboxId; this.queue = queue; this.query = ''; this.priorityOnly = false;
      this.syncSelection(); this.backToList();
      this.$nextTick(() => this.revealMailbox());
    },
    revealMailbox(queues = this.$refs.queues) {
      const group = queues.querySelector(`[data-scope="${this.mailboxId}"]`);
      if (group) group.open = true;
    },
    select(id, open = true) {
      const refs = this.$refs;
      this.page = Math.max(1, Math.floor(this.filtered.findIndex(ticket => ticket.id === id) / this.pageSize) + 1);
      this.selectedId = id; this.ticket.unread = false; this.tagInput = ''; this.error = '';
      if (open) {
        this.view = 'ticket';
        this.$nextTick(() => { if (refs.back.getClientRects().length) refs.ticketTitle?.focus(); });
      }
    },
    moveSelection(direction) {
      const index = this.filtered.findIndex(ticket => ticket.id === this.selectedId);
      const next = this.filtered[index + direction];
      if (next) { this.select(next.id, false); this.$nextTick(() => this.$refs.ticketList.querySelector(`[data-ticket-id="${next.id}"]`)?.focus()); }
    },
    showQueues() {
      this.view = 'queues';
      this.$nextTick(() => {
        this.revealMailbox();
        this.$refs.queues.querySelector('[aria-current="page"]')?.focus();
      });
    },
    backToList() {
      const list = this.$refs.ticketList;
      this.view = 'list';
      this.$nextTick(() => {
        if (list.getClientRects().length) list.querySelector(`[data-ticket-id="${this.selectedId}"]`)?.focus();
      });
    },
    showCustomer() { this.view = 'customer'; this.$nextTick(() => this.$refs.customerBack.focus()); },
    backToTicket() { this.view = 'ticket'; this.$nextTick(() => this.$refs.customerToggle.focus()); },
    openRelated(id) {
      const ticket = this.tickets.find(ticket => ticket.id === id);
      if (!ticket) return;
      const queues = this.$refs.queues;
      if (this.mailboxId !== 'all') this.mailboxId = ticket.mailboxId;
      this.queue = ticket.status; this.query = ''; this.priorityOnly = false; this.select(id);
      this.$nextTick(() => this.revealMailbox(queues));
    },
    updateStatus(status) {
      if (!this.ticket || !['open', 'waiting', 'closed'].includes(status)) return;
      const id = this.ticket.id;
      this.ticket.status = status;
      this.syncSelection(); this.backToList();
      this.notify(`Conversation #${id} ${status === 'closed' ? 'closed' : status === 'waiting' ? 'moved to Waiting' : 'reopened'}`);
    },
    assign(id) {
      if (!this.ticket || (id && !this.agents.some(agent => agent.id === id))) return;
      this.ticket.assignee = id;
      this.notify(id ? `Assigned to ${this.agents.find(agent => agent.id === id).name}` : 'Conversation unassigned');
      this.syncSelection();
      if (!this.ticket) this.backToList();
    },
    togglePriority() { this.priorityOnly = !this.priorityOnly; this.syncSelection(); },
    clearFilters() { this.query = ''; this.priorityOnly = false; this.syncSelection(); this.$nextTick(() => this.$refs.search.focus()); },
    addTag() {
      const value = this.tagInput.trim();
      if (!this.ticket || !value) return;
      if (!this.ticket.tags.some(tag => tag.toLowerCase() === value.toLowerCase())) this.ticket.tags.push(value);
      this.tagInput = '';
    },
    removeTag(tag) { this.ticket.tags = this.ticket.tags.filter(value => value !== tag); },
    send() {
      if (!this.ticket) return;
      const body = this.draft.trim();
      if (!body) { this.error = this.mode === 'note' ? 'Write a note before adding it.' : 'Write a message before replying.'; this.$refs.replyBody.focus(); return; }
      const ticket = this.ticket;
      ticket.threads.push({ kind: this.mode === 'note' ? 'note' : 'reply', author: 'Alex Morgan', ...(this.mode === 'reply' ? { from: this.mailbox(ticket.mailboxId).email } : {}), time: 'Just now', body });
      ticket.preview = this.mode === 'note' ? `Internal note: ${body}` : body;
      ticket.time = 'Now';
      if (this.mode === 'reply' && ticket.status === 'closed') { ticket.status = 'open'; this.queue = 'open'; this.query = ''; this.priorityOnly = false; }
      this.draft = '';
      this.notify(this.mode === 'note' ? 'Internal note added · visible to your team' : 'Reply added to the demo conversation');
      this.$nextTick(() => { this.$refs.thread.scrollTop = this.$refs.thread.scrollHeight; });
    },
    openNew() { this.newMailboxId = this.mailboxId === 'all' ? this.mailboxes[0].id : this.mailboxId; this.newError = ''; this.$refs.newConversation.showModal(); },
    create() {
      const name = this.newName.trim(), email = this.newEmail.trim(), subject = this.newSubject.trim(), body = this.newMessage.trim();
      if (!name || !email || !subject || !body) { this.newError = 'Complete each field to create a conversation.'; return; }
      if (!this.mailbox(this.newMailboxId)) return;
      const id = Math.max(...this.tickets.map(ticket => ticket.id)) + 1;
      this.tickets.unshift({ id, mailboxId: this.newMailboxId, customer: { name, email, initials: name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase(), company: 'New customer', plan: 'Not specified', members: 1, since: 'Today', location: 'Not specified' }, subject, status: 'open', assignee: '', priority: 'normal', unread: false, time: 'Now', tags: [], preview: body, threads: [{ kind: 'customer', author: '', time: 'Just now', body }] });
      if (this.mailboxId !== 'all') this.mailboxId = this.newMailboxId;
      this.queue = 'open'; this.query = ''; this.priorityOnly = false; this.select(id);
      this.$nextTick(() => this.revealMailbox());
      this.newName = ''; this.newEmail = ''; this.newSubject = ''; this.newMessage = '';
      this.$refs.newConversation.close(); this.notify(`Conversation #${id} created`);
    },
  };
}
