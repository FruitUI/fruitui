import { tickets, queues, agents, mailboxes, teamRooms } from './tickets.js';

export function supportDemo() {
  return {
    tickets: structuredClone(tickets),
    queues,
    agents,
    mailboxes,
    mailboxId: 'all',
    queue: 'open',
    query: '',
    priorityOnly: false,
    selectedId: 1042,
    // A mailbox's team chat, open in place of the list and conversation (null: the mailboxes).
    rooms: structuredClone(teamRooms),
    roomId: null,
    roomDrafts: {},
    roomFiles: [],
    // Where the "New" divider goes: the first message that was unread when the room opened.
    roomNewFrom: null,
    roomTyping: '',
    roomAnswered: {},
    // The room Team Chat opens: the last one chosen in the switcher (most agents use one).
    roomChoice: 'support',
    // Conversations checked for a bulk action (Cmd/Ctrl+click, Shift+click, or Select).
    checked: [],
    page: 1,
    pageSize: 10,
    view: 'list',
    mode: 'reply',
    tagInput: '',
    error: '',
    drafts: {
      1042: {
        reply:
          'Hi Sophie,\n\nAbsolutely — all your projects and comments will stay right where they are. You can upgrade from Settings → Billing and invite your teammates whenever you’re ready.\n\nAnnual billing is available, too. Happy to help you get the studio settled in!\n\nAlex',
        note: '',
      },
    },
    newMailboxId: 'support',
    newName: '',
    newEmail: '',
    newSubject: '',
    newMessage: '',
    newError: '',
    mailbox(id) {
      return this.mailboxes.find(mailbox => mailbox.id === id);
    },
    get queueTitle() {
      const label = this.queues.find(queue => queue.id === this.queue)?.label;
      return this.mailboxId === 'all'
        ? this.queue === 'open'
          ? 'All Inboxes'
          : label
        : `${this.mailbox(this.mailboxId).name} · ${label}`;
    },
    get scopeDescription() {
      return this.mailboxId === 'all' ? `${this.mailboxes.length} mailboxes` : this.mailbox(this.mailboxId).email;
    },
    matchesScope(ticket, mailboxId) {
      return mailboxId === 'all' || ticket.mailboxId === mailboxId;
    },
    matchesQueue(ticket, queue) {
      return queue === 'mine'
        ? ticket.status !== 'closed' && ticket.assignee === 'alex'
        : queue === 'unassigned'
          ? ticket.status !== 'closed' && !ticket.assignee
          : ticket.status === queue;
    },
    count(queue, mailboxId = 'all') {
      return this.tickets.filter(ticket => this.matchesScope(ticket, mailboxId) && this.matchesQueue(ticket, queue))
        .length;
    },
    get filtered() {
      const query = this.query.trim().toLowerCase();
      return this.tickets
        .filter(
          ticket =>
            this.matchesScope(ticket, this.mailboxId) &&
            this.matchesQueue(ticket, this.queue) &&
            (!this.priorityOnly || ['high', 'urgent'].includes(ticket.priority)) &&
            (!query ||
              [
                ticket.id,
                ticket.customer.name,
                ticket.customer.email,
                ticket.subject,
                ...ticket.tags,
                ...ticket.threads.filter(thread => thread.kind !== 'event').map(thread => thread.body),
              ]
                .join(' ')
                .toLowerCase()
                .includes(query)),
        )
        .sort((a, b) => b.id - a.id);
    },
    get pageCount() {
      return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    },
    get paged() {
      return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
    },
    changePage(page) {
      this.page = Math.max(1, Math.min(page, this.pageCount));
      if (this.paged[0]) this.select(this.paged[0].id, false);
    },
    get assigneeValue() {
      return this.ticket?.assignee ?? '';
    },
    set assigneeValue(value) {
      if (this.ticket && value !== this.ticket.assignee) this.assign(value);
    },
    sendAndClose() {
      if (this.mode !== 'reply' || !this.draft.trim()) return;
      this.send();
      this.updateStatus('closed');
    },
    get room() {
      return this.roomId
        ? { id: this.roomId, name: this.mailbox(this.roomId).name, messages: this.rooms[this.roomId] }
        : null;
    },
    roomUnread(id) {
      return this.rooms[id].filter(message => message.unread).length;
    },
    get roomUnreadTotal() {
      return Object.keys(this.rooms).reduce((total, id) => total + this.roomUnread(id), 0);
    },
    person(id) {
      const name = this.agents.find(agent => agent.id === id)?.name ?? id;
      return {
        name,
        initials: name
          .split(' ')
          .map(word => word[0])
          .join(''),
      };
    },
    /** A message's text with conversation numbers (#1042) and mentions (@mia) picked out. */
    parts(body) {
      return body
        .split(/(#\d{4}\b|@[a-z]+\b)/)
        .filter(Boolean)
        .map(text => {
          const ticket = text.startsWith('#') && this.tickets.find(item => item.id === Number(text.slice(1)));
          if (ticket) return { text, ticket: ticket.id, title: ticket.subject };
          if (text.startsWith('@') && this.agents.some(agent => agent.id === text.slice(1)))
            return { text, mention: true };
          return { text };
        });
    },
    /**
     * The room as sections, each a labelled divider and a list: one per day, and a "New" section from
     * the first message that was unread. A run of messages from one person shows the name once; a pinned
     * message starts its own run.
     */
    get roomSections() {
      const sections = [];
      (this.room?.messages ?? []).forEach((message, index) => {
        let section = sections.at(-1);
        const fresh = index === this.roomNewFrom;
        if (!section || section.day !== message.day || fresh) {
          section = {
            key: `${message.day}-${index}`,
            day: message.day,
            label: fresh ? 'New' : message.day,
            accent: fresh,
            messages: [],
          };
          sections.push(section);
        }
        const previous = section.messages.at(-1);
        // A pinned message keeps its header, so its pin sits beside its time.
        section.messages.push({ ...message, index, continued: previous?.author === message.author && !message.pinned });
      });
      return sections;
    },
    /** The room's details: pinned messages first to last, and the newest attachments. */
    get roomPinned() {
      return (this.room?.messages ?? [])
        .map((message, index) => ({ ...message, index }))
        .filter(message => message.pinned);
    },
    get roomAttachments() {
      return (this.room?.messages ?? [])
        .flatMap((message, index) =>
          (message.attachments ?? []).map(file => ({ ...file, index, author: message.author, time: message.time })),
        )
        .reverse()
        .slice(0, 6);
    },
    togglePin(index) {
      const message = this.rooms[this.roomId][index];
      message.pinned = !message.pinned;
    },
    /** Scroll a message into view and focus it: from a pinned message or an attachment in the details. */
    showMessage(index) {
      if (this.view === 'roomDetails') this.view = 'room';
      this.$nextTick(() =>
        requestAnimationFrame(() => {
          const message = document
            .getElementById('support-room-history')
            ?.querySelector(`[data-room-index="${index}"]`);
          message?.scrollIntoView({ block: 'center' });
          message?.focus({ preventScroll: true });
        }),
      );
    },
    showRoomDetails() {
      const refs = this.$refs;
      this.view = 'roomDetails';
      this.$nextTick(() => requestAnimationFrame(() => refs.roomDetailsBack.focus()));
    },
    hideRoomDetails() {
      const refs = this.$refs;
      this.view = 'room';
      this.$nextTick(() => requestAnimationFrame(() => refs.roomDetailsToggle.focus()));
    },
    get roomDraft() {
      return this.roomDrafts[this.roomId] ?? '';
    },
    set roomDraft(value) {
      if (this.roomId) this.roomDrafts[this.roomId] = value;
    },
    /** Team Chat opens the chosen room; the switcher in its title changes and remembers the choice. */
    openRoom(id = this.roomChoice) {
      if (!this.rooms[id]) return;
      this.roomChoice = id;
      const messages = this.rooms[id];
      const first = messages.findIndex(message => message.unread);
      this.roomNewFrom = first < 0 ? null : first;
      messages.forEach(message => (message.unread = false));
      this.roomId = id;
      this.roomFiles = [];
      this.roomTyping = '';
      this.checked = [];
      this.view = 'room';
      const refs = this.$refs;
      // x-show may reveal the room a frame after the reactive update (as in Firefox and WebKit).
      this.$nextTick(() =>
        requestAnimationFrame(() => {
          // On a phone the sidebar gives way to the room: move focus to its title.
          if (!refs.queues.getClientRects().length) refs.roomTitle.focus();
        }),
      );
    },
    leaveRoom() {
      this.roomId = null;
      this.roomNewFrom = null;
    },
    backToRoom() {
      const refs = this.$refs;
      this.view = 'room';
      this.$nextTick(() => requestAnimationFrame(() => refs.roomTitle.focus()));
    },
    addRoomFiles(files) {
      for (const file of files)
        this.roomFiles.push({
          name: file.name,
          size: file.size < 1024 ? `${file.size} B` : `${Math.round(file.size / 1024)} KB`,
          href: URL.createObjectURL(file),
        });
    },
    sendRoom() {
      const body = this.roomDraft.trim();
      if (!this.room || (!body && !this.roomFiles.length)) return;
      const id = this.roomId;
      this.rooms[id].push({ author: 'alex', day: 'Today', time: 'Just now', body, attachments: [...this.roomFiles] });
      this.roomDraft = '';
      this.roomFiles = [];
      // The first time, a teammate answers after a moment, so the history follows an arrival.
      if (this.roomAnswered[id]) return;
      this.roomAnswered[id] = true;
      const teammate = id === 'billing' ? 'noah' : 'mia';
      setTimeout(() => {
        if (this.roomId === id) this.roomTyping = this.person(teammate).name.split(' ')[0];
      }, 600);
      setTimeout(() => {
        this.rooms[id].push({
          author: teammate,
          day: 'Today',
          time: 'Just now',
          body: 'Thanks, I’ll take a look.',
          unread: this.roomId !== id,
        });
        this.roomTyping = '';
      }, 2200);
    },
    /** A conversation from the website chat, shown in the Chat view. */
    get chat() {
      return this.ticket?.channel === 'chat';
    },
    /** The open conversation's entries with their place in the history: newest first, or oldest first in a chat. */
    get timeline() {
      const entries = (this.ticket?.threads ?? []).map((entry, index) => ({ ...entry, index }));
      return this.chat ? entries : entries.reverse();
    },
    get ticket() {
      return this.tickets.find(ticket => ticket.id === this.selectedId) ?? null;
    },
    get related() {
      return this.ticket
        ? this.tickets.filter(
            ticket => ticket.customer.email === this.ticket.customer.email && ticket.id !== this.ticket.id,
          )
        : [];
    },
    get customerConversationCount() {
      return this.ticket ? this.related.length + 1 : 0;
    },
    get draft() {
      return this.drafts[this.selectedId]?.[this.mode] ?? '';
    },
    set draft(value) {
      if (this.selectedId === null) return;
      this.drafts[this.selectedId] ??= { reply: '', note: '' };
      this.drafts[this.selectedId][this.mode] = value;
      this.error = '';
    },
    syncSelection() {
      if (!this.filtered.some(ticket => ticket.id === this.selectedId)) this.selectedId = this.filtered[0]?.id ?? null;
      this.page = Math.max(
        1,
        Math.floor(this.filtered.findIndex(ticket => ticket.id === this.selectedId) / this.pageSize) + 1,
      );
      this.tagInput = '';
      this.error = '';
    },
    setQueue(queue, mailboxId = 'all') {
      if (!this.queues.some(item => item.id === queue) || (mailboxId !== 'all' && !this.mailbox(mailboxId))) return;
      this.leaveRoom();
      this.mailboxId = mailboxId;
      this.queue = queue;
      this.checked = [];
      this.query = '';
      this.priorityOnly = false;
      this.syncSelection();
      this.backToList();
      this.$nextTick(() => this.revealMailbox());
    },
    revealMailbox(queues = this.$refs.queues, mailboxId = this.mailboxId) {
      const group = queues.querySelector(`[data-scope="${mailboxId}"]`);
      if (group) group.open = true;
    },
    select(id, open = true) {
      const refs = this.$refs;
      this.leaveRoom();
      this.page = Math.max(1, Math.floor(this.filtered.findIndex(ticket => ticket.id === id) / this.pageSize) + 1);
      this.selectedId = id;
      this.ticket.unread = false;
      this.tagInput = '';
      this.error = '';
      if (open) {
        this.view = 'ticket';
        this.$nextTick(() => {
          if (refs.back.getClientRects().length) refs.ticketTitle?.focus();
        });
      }
    },
    moveSelection(direction) {
      const index = this.filtered.findIndex(ticket => ticket.id === this.selectedId);
      const next = this.filtered[index + direction];
      if (next) {
        this.select(next.id, false);
        this.$nextTick(() =>
          document.getElementById('support-tickets')?.querySelector(`[data-ticket-id="${next.id}"]`)?.focus(),
        );
      }
    },
    showQueues() {
      this.view = 'queues';
      this.$nextTick(() => {
        this.revealMailbox();
        this.$refs.queues.querySelector('[aria-current="page"]')?.focus();
      });
    },
    backToList() {
      const list = document.getElementById('support-tickets');
      this.view = 'list';
      this.$nextTick(() => {
        if (list.getClientRects().length) list.querySelector(`[data-ticket-id="${this.selectedId}"]`)?.focus();
      });
    },
    showCustomer() {
      this.view = 'customer';
      this.$nextTick(() => this.$refs.customerBack.focus());
    },
    backToTicket() {
      this.view = 'ticket';
      this.$nextTick(() => this.$refs.customerToggle.focus());
    },
    openRelated(id) {
      const ticket = this.tickets.find(ticket => ticket.id === id);
      if (!ticket) return;
      const queues = this.$refs.queues;
      if (this.mailboxId !== 'all') this.mailboxId = ticket.mailboxId;
      this.queue = ticket.status;
      this.query = '';
      this.priorityOnly = false;
      this.select(id);
      this.$nextTick(() => this.revealMailbox(queues));
    },
    updateStatus(status) {
      if (!this.ticket || !['open', 'waiting', 'closed'].includes(status)) return;
      const id = this.ticket.id;
      this.ticket.status = status;
      this.syncSelection();
      this.backToList();
      this.$toast(
        `Conversation #${id} ${status === 'closed' ? 'closed' : status === 'waiting' ? 'moved to Waiting' : 'reopened'}`,
      );
    },
    assign(id) {
      if (!this.ticket || (id && !this.agents.some(agent => agent.id === id))) return;
      this.ticket.assignee = id;
      // The thread records the change as an event between messages.
      const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      this.ticket.threads.push({
        kind: 'event',
        author: '',
        time: now,
        body: id
          ? `Alex Morgan assigned this to ${this.agents.find(agent => agent.id === id).name}`
          : 'Alex Morgan unassigned this',
      });
      this.$toast(id ? `Assigned to ${this.agents.find(agent => agent.id === id).name}` : 'Conversation unassigned');
      this.syncSelection();
      if (!this.ticket) this.backToList();
    },
    /** Apply a change to every checked conversation (or the given ones), then clear the selection and report it. */
    bulk(change, message, ids = this.checked) {
      const chosen = this.tickets.filter(ticket => ids.includes(ticket.id));
      if (!chosen.length) return;
      chosen.forEach(change);
      this.checked = [];
      this.syncSelection();
      this.$toast(message(chosen.length === 1 ? '1 conversation' : `${chosen.length} conversations`));
    },
    /**
     * What a row's context menu acts on: the whole selection when the row is part of it, as in mail
     * apps; otherwise that row alone, leaving the selection as it is.
     */
    menuTargets(item) {
      return this.checked.length > 1 && this.checked.includes(item.id) ? [...this.checked] : [item.id];
    },
    menuLabel(item) {
      const count = this.menuTargets(item).length;
      return count > 1 ? `Actions for ${count} conversations` : `Actions for ${item.customer.name}`;
    },
    /** A single unread row offers Mark as Read; otherwise the menu marks as unread, as the selection bar does. */
    rowMarksRead(item) {
      return item.unread && this.menuTargets(item).length === 1;
    },
    /** A single closed row offers Reopen; otherwise the menu closes. */
    rowReopens(item) {
      return item.status === 'closed' && this.menuTargets(item).length === 1;
    },
    toggleRowRead(item) {
      const read = this.rowMarksRead(item);
      this.rowAction(
        item,
        ticket => (ticket.unread = !read),
        count => `${count} marked as ${read ? 'read' : 'unread'}`,
      );
    },
    assignRowToMe(item) {
      this.rowAction(
        item,
        ticket => (ticket.assignee = 'alex'),
        count => `${count} assigned to you`,
      );
    },
    waitRow(item) {
      this.rowAction(
        item,
        ticket => (ticket.status = 'waiting'),
        count => `${count} moved to Waiting`,
      );
    },
    closeRow(item) {
      const reopen = this.rowReopens(item);
      this.rowAction(
        item,
        ticket => (ticket.status = reopen ? 'open' : 'closed'),
        count => `${count} ${reopen ? 'reopened' : 'closed'}`,
      );
    },
    rowAction(item, change, message) {
      const ids = this.menuTargets(item);
      const keep = ids.length === 1 && !this.checked.includes(item.id) ? [...this.checked] : [];
      this.bulk(change, message, ids);
      // A row acted on alone leaves the rest of the selection in place.
      this.checked = keep;
      this.syncSelection();
    },
    assignChecked(id) {
      if (id && !this.agents.some(agent => agent.id === id)) return;
      const name = this.agents.find(agent => agent.id === id)?.name;
      this.bulk(
        ticket => (ticket.assignee = id),
        count => (id ? `${count} assigned to ${name}` : `${count} unassigned`),
      );
    },
    closeChecked() {
      this.bulk(
        ticket => (ticket.status = 'closed'),
        count => `${count} closed`,
      );
    },
    waitChecked() {
      this.bulk(
        ticket => (ticket.status = 'waiting'),
        count => `${count} moved to Waiting`,
      );
    },
    markCheckedUnread() {
      this.bulk(
        ticket => (ticket.unread = true),
        count => `${count} marked as unread`,
      );
    },
    togglePriority() {
      this.priorityOnly = !this.priorityOnly;
      this.syncSelection();
    },
    clearFilters() {
      this.query = '';
      this.priorityOnly = false;
      this.syncSelection();
      this.$nextTick(() => this.$refs.search.focus());
    },
    addTag() {
      const value = this.tagInput.trim();
      if (!this.ticket || !value) return;
      if (!this.ticket.tags.some(tag => tag.toLowerCase() === value.toLowerCase())) this.ticket.tags.push(value);
      this.tagInput = '';
    },
    removeTag(tag) {
      this.ticket.tags = this.ticket.tags.filter(value => value !== tag);
    },
    // Internal notes never reach a customer reply, so only customer messages and replies can be quoted.
    /** Send a failed reply again; the demo always succeeds the second time. */
    retry(entry) {
      const original = this.ticket.threads[entry.index];
      original.delivery = null;
      this.$toast(`Reply sent to ${this.ticket.customer.name}`, { tone: 'success' });
    },
    showLog(entry) {
      const log = document.createElement('pre');
      log.textContent = entry.delivery.log;
      this.$dialog({ title: 'Delivery log', html: log });
    },
    removeAttachment(entry, file) {
      const original = this.ticket.threads[entry.index];
      original.attachments = original.attachments.filter(item => item !== file && item.name !== file.name);
      this.$toast(`Removed ${file.name}`);
    },
    quote(entry) {
      if (!this.ticket || entry.kind === 'note') return;
      this.mode = 'reply';
      const quoted = entry.body
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
      this.draft = `${this.draft ? `${this.draft.trimEnd()}\n\n` : ''}${quoted}\n\n`;
      this.$nextTick(() => {
        const box = this.$refs.replyBody;
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      });
    },
    send() {
      if (!this.ticket) return;
      const body = this.draft.trim();
      if (!body) {
        this.error = this.mode === 'note' ? 'Write a note before adding it.' : 'Write a message before replying.';
        this.$refs.replyBody.focus();
        return;
      }
      const ticket = this.ticket;
      ticket.threads.push({
        kind: this.mode === 'note' ? 'note' : 'reply',
        author: 'Alex Morgan',
        ...(this.mode === 'reply' && !this.chat ? { from: this.mailbox(ticket.mailboxId).email } : {}),
        time: 'Just now',
        body,
      });
      ticket.preview = this.mode === 'note' ? `Internal note: ${body}` : body;
      ticket.time = 'Now';
      if (this.mode === 'reply' && ticket.status === 'closed') {
        ticket.status = 'open';
        this.queue = 'open';
        this.query = '';
        this.priorityOnly = false;
      }
      this.draft = '';
      this.$toast(
        this.mode === 'note' ? 'Internal note added · visible to your team' : 'Reply added to the demo conversation',
      );
      // Newest first: the new entry is at the top. A chat's history follows it at the bottom by itself.
      if (!this.chat) this.$nextTick(() => (this.$refs.thread.scrollTop = 0));
    },
    openNew() {
      this.newMailboxId = this.mailboxId === 'all' ? this.mailboxes[0].id : this.mailboxId;
      this.newError = '';
      this.$refs.newConversation.showModal();
    },
    create() {
      const name = this.newName.trim(),
        email = this.newEmail.trim(),
        subject = this.newSubject.trim(),
        body = this.newMessage.trim();
      if (!name || !email || !subject || !body) {
        this.newError = 'Complete each field to create a conversation.';
        return;
      }
      if (!this.mailbox(this.newMailboxId)) return;
      const id = Math.max(...this.tickets.map(ticket => ticket.id)) + 1;
      this.tickets.unshift({
        id,
        mailboxId: this.newMailboxId,
        customer: {
          name,
          email,
          initials: name
            .split(/\s+/)
            .slice(0, 2)
            .map(word => word[0])
            .join('')
            .toUpperCase(),
          company: 'New customer',
          plan: 'Not specified',
          members: 1,
          since: 'Today',
          location: 'Not specified',
        },
        subject,
        status: 'open',
        assignee: '',
        priority: 'normal',
        unread: false,
        time: 'Now',
        tags: [],
        preview: body,
        threads: [{ kind: 'customer', author: '', time: 'Just now', body }],
      });
      if (this.mailboxId !== 'all') this.mailboxId = this.newMailboxId;
      this.queue = 'open';
      this.query = '';
      this.priorityOnly = false;
      this.select(id);
      this.$nextTick(() => this.revealMailbox());
      this.newName = '';
      this.newEmail = '';
      this.newSubject = '';
      this.newMessage = '';
      this.$refs.newConversation.close();
      this.$toast(`Conversation #${id} created`);
    },
  };
}
