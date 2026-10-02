import { fruitToast } from '../../src/js/toast.js';
import { rooms, people } from './conversations.js';

export function chatDemo() {
  return {
    ...fruitToast(),
    rooms: structuredClone(rooms), people,
    roomId: 'design', mode: 'room', view: 'conversation', threadId: 202, query: '',
    drafts: {}, threadDrafts: {}, error: '', threadError: '',
    nextId: 1000, highlightedId: null,
    newChannelName: '', newChannelDescription: '', channelError: '', recipientId: 'oliver',
    person(id) { return this.people.find(person => person.id === id); },
    get room() { return this.rooms.find(room => room.id === this.roomId); },
    get channels() { return this.rooms.filter(room => room.kind === 'channel'); },
    get directMessages() { return this.rooms.filter(room => room.kind === 'dm'); },
    get thread() { return this.room.messages.find(message => message.id === this.threadId) ?? null; },
    get searching() { return Boolean(this.query.trim()); },
    unreadCount(room) { return room.messages.filter(message => message.unread).length; },
    get unreadTotal() { return this.rooms.reduce((total, room) => total + this.unreadCount(room), 0); },
    get allMessages() { return this.rooms.flatMap(room => room.messages.map(message => ({ room, message }))); },
    get allThreads() { return this.allMessages.filter(({ message }) => message.replies.length > 0); },
    get activityResults() {
      if (!this.searching) return this.mode === 'unread' ? this.allMessages.filter(({ message }) => message.unread) : this.allThreads;
      const query = this.query.trim().toLowerCase();
      return this.allMessages.flatMap(({ room, message }) => [
        { room, message }, ...message.replies.map(reply => ({ room, message: reply, parentId: message.id })),
      ]).filter(({ room, message }) => [room.name, this.person(message.authorId).name, message.body].join(' ').toLowerCase().includes(query));
    },
    get activityVisible() { return this.searching || this.mode !== 'room'; },
    get title() { return this.searching ? 'Search results' : this.mode === 'unread' ? 'All unread' : this.mode === 'threads' ? 'Threads' : this.room.kind === 'channel' ? `# ${this.room.name}` : this.room.name; },
    get subtitle() {
      return this.activityVisible ? `${this.activityResults.length} ${this.searching ? 'results across Forma' : this.mode === 'unread' ? 'unread messages' : 'conversations with replies'}`
        : this.room.kind === 'dm' ? (this.person(this.room.personId).available ? 'Available' : 'Away') : this.room.description;
    },
    get draft() { return this.drafts[this.roomId] ?? ''; },
    set draft(value) { this.drafts[this.roomId] = value; this.error = ''; },
    get threadDraft() { return this.threadDrafts[this.threadId] ?? ''; },
    set threadDraft(value) { if (this.threadId !== null) this.threadDrafts[this.threadId] = value; this.threadError = ''; },
    chooseRoom(id, focus = true) {
      if (!this.rooms.some(room => room.id === id)) return;
      const refs = this.$refs;
      this.roomId = id; this.mode = 'room'; this.query = ''; this.view = 'conversation'; this.threadId = null;
      this.error = ''; this.threadError = ''; this.highlightedId = null;
      this.room.messages.forEach(message => { message.unread = false; });
      this.$nextTick(() => { this.revealRoom(refs.sidebar); if (focus) refs.roomTitle.focus(); });
    },
    showActivity(mode) {
      if (!['unread', 'threads'].includes(mode)) return;
      const title = this.$refs.roomTitle;
      this.mode = mode; this.query = ''; this.threadId = null; this.view = 'conversation'; this.highlightedId = null;
      this.$nextTick(() => title.focus());
    },
    searchChanged() { this.view = 'conversation'; this.threadId = null; this.highlightedId = null; },
    clearSearch() { this.query = ''; this.$nextTick(() => this.$refs.search.focus()); },
    showRooms() {
      this.view = 'rooms';
      const sidebar = this.$refs.sidebar;
      this.$nextTick(() => { this.revealRoom(sidebar); sidebar.querySelector('[aria-current="page"]')?.focus(); });
    },
    revealRoom(sidebar) { const group = sidebar.querySelector(`[data-room-id="${this.roomId}"]`)?.closest('details'); if (group) group.open = true; },
    backToConversation() { this.view = 'conversation'; this.$nextTick(() => this.$refs.roomTitle.focus()); },
    openResult(result) {
      const refs = this.$refs;
      const inThread = Boolean(result.parentId) || (!this.searching && this.mode === 'threads');
      this.chooseRoom(result.room.id, false);
      this.highlightedId = result.parentId ?? result.message.id;
      if (inThread) this.openThread(result.parentId ?? result.message.id);
      else this.$nextTick(() => requestAnimationFrame(() => {
        // x-show may reveal its pane in a frame after reactive DOM updates (WebKit).
        const message = refs.history.querySelector(`[data-message-id="${this.highlightedId}"]`);
        message?.scrollIntoView({ block: 'nearest' }); message?.focus();
      }));
    },
    openThread(id) {
      if (!this.room.messages.some(message => message.id === id)) return;
      const heading = this.$refs.threadTitle;
      this.threadId = id; this.view = 'thread'; this.threadError = '';
      this.$nextTick(() => heading.focus());
    },
    closeThread() {
      const refs = this.$refs, id = this.threadId;
      this.threadId = null; this.view = 'conversation';
      this.$nextTick(() => {
        const trigger = refs.history.querySelector(`[data-thread-trigger="${id}"]`);
        if (trigger?.getClientRects().length) trigger.focus(); else refs.roomTitle.focus();
      });
    },
    send(inThread = false) {
      const refs = this.$refs;
      const body = (inThread ? this.threadDraft : this.draft).trim();
      if (!body) {
        if (inThread) this.threadError = 'Write a reply before sending.'; else this.error = 'Write a message before sending.';
        (inThread ? refs.threadComposer : refs.composer).focus(); return;
      }
      if (inThread && !this.thread) return;
      const message = { id: this.nextId++, authorId: 'alex', body, time: 'Just now', unread: false, reactions: [], replies: [] };
      if (inThread) { this.thread.replies.push(message); this.threadDraft = ''; }
      else { this.room.messages.push(message); this.draft = ''; }
      this.$nextTick(() => {
        const history = inThread ? refs.threadHistory : refs.history;
        history.scrollTop = history.scrollHeight;
        (inThread ? refs.threadComposer : refs.composer).focus();
      });
    },
    toggleReaction(message, emoji) {
      if (!['👍', '✨', '❤️'].includes(emoji)) return;
      let reaction = message.reactions.find(reaction => reaction.emoji === emoji);
      if (!reaction) { message.reactions.push({ emoji, people: ['alex'] }); return; }
      const index = reaction.people.indexOf('alex');
      if (index < 0) reaction.people.push('alex');
      else { reaction.people.splice(index, 1); if (!reaction.people.length) message.reactions.splice(message.reactions.indexOf(reaction), 1); }
    },
    markAllRead() { this.rooms.forEach(room => room.messages.forEach(message => { message.unread = false; })); this.notify('All messages marked as read'); },
    openDetails() { this.$refs.details.showModal(); },
    openChannel() { this.channelError = ''; this.$refs.newChannel.showModal(); },
    createChannel() {
      const name = this.newChannelName.trim(), description = this.newChannelDescription.trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || !description) { this.channelError = 'Add a channel name and description.'; return; }
      if (this.channels.some(room => room.name === name)) { this.channelError = 'That channel already exists. Choose another name.'; return; }
      const id = `channel-${this.nextId++}`;
      this.rooms.push({ id, kind: 'channel', name, description, members: ['alex'], messages: [] });
      this.chooseRoom(id); this.newChannelName = ''; this.newChannelDescription = ''; this.$refs.newChannel.close();
      this.notify(`Channel #${name} created`);
    },
    openDirectMessage() { this.$refs.newDirectMessage.showModal(); },
    startDirectMessage() {
      const person = this.person(this.recipientId);
      if (!person || person.id === 'alex') return;
      let room = this.directMessages.find(room => room.personId === person.id);
      if (!room) {
        room = { id: `dm-${person.id}`, kind: 'dm', personId: person.id, name: person.name, description: `A conversation with ${person.name}.`, members: ['alex', person.id], messages: [] };
        this.rooms.push(room);
      }
      this.chooseRoom(room.id); this.$refs.newDirectMessage.close();
      this.$nextTick(() => this.$refs.composer.focus());
    },
  };
}
