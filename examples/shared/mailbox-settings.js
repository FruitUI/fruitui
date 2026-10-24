/*
 * A mailbox's settings, shared by the Settings example (its Mailboxes list, a person's mailboxes, the
 * AI Assistant's row per mailbox) and the Support example, where they're edited: in the mailbox, its
 * pages listed beside the open one.
 */
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

/** Markdown as customers will see it. */
export const asSent = text => markdown.parse(text ?? '');

/** A mailbox's pages, in the order its settings list them: its own, then each further one. */
export const mailboxPages = {
  general: 'General',
  connection: 'Connection',
  permissions: 'Permissions',
  'auto-reply': 'Auto Reply',
  ai: 'AI Assistant',
};

export const languages = {
  default: 'Default',
  en: 'English',
  nl: 'Dutch',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  ja: 'Japanese',
};

/** A new mailbox has only a name: an email address is optional, as a mailbox may only chat. */
export const mailboxSettings = (name, email = '', color = 'blue', details = {}) => ({
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

/** The sample team's mailboxes, as both examples start them. */
export const sampleMailboxes = () => ({
  support: mailboxSettings('Support', 'support@forma.example', 'blue'),
  billing: mailboxSettings('Billing', 'billing@forma.example', 'green', {
    agents: ['alex'],
    autoReply: true,
    aiLanguage: 'nl',
    chatTranslation: true,
  }),
  feedback: mailboxSettings('Feedback', 'feedback@forma.example', 'purple', {
    sending: 'php',
    agents: ['alex', 'mia', 'noah'],
    aiSummaries: false,
    aiTranslations: false,
    aiDrafts: false,
  }),
});

/** The installation's default language, which a mailbox's Default follows. */
export const defaultLanguage = 'en';

export const people = box => (box.agents.length === 1 ? '1 person' : `${box.agents.length} people`);

/** A mailbox's AI Assistant at a glance: its language while any feature is on. */
export const aiSummary = (box, fallback = defaultLanguage) => {
  if (![box.aiSummaries, box.aiTranslations, box.aiDrafts, box.chatTranslation].some(Boolean)) return 'Off';
  return `On · ${languages[box.aiLanguage === 'default' ? fallback : box.aiLanguage]}`;
};

/** The current value a mailbox's row shows for one of its pages. */
export const pageSummary = (box, page) => {
  // General's own row says only what's missing: a mailbox without an address only chats.
  if (page === 'general') return box.email ? '' : 'No email address';
  if (page === 'connection') {
    if (!box.email) return 'Not set up';
    return box.sending === 'smtp' ? `SMTP · ${box.smtpHost}` : 'The server’s mail';
  }
  if (page === 'permissions') return people(box);
  if (page === 'ai') return aiSummary(box);
  return box.autoReply ? 'On' : 'Off';
};

/**
 * Changes are saved as they're made, so there's nothing to submit. A field that can't take an entry
 * says why beside it when it's committed (on leaving a text field), until it's corrected.
 */
export const checkField = event => {
  const control = event.target;
  const field = control.closest?.('.f-field');
  if (!control.willValidate || !control.id || !field) return;
  const id = `${control.id}-error`;
  let error = document.getElementById(id);
  // While typing, a shown message follows the entry; a new one waits for the change.
  if (event.type === 'input' && !error) return;
  const described = (control.getAttribute('aria-describedby') ?? '').split(' ').filter(token => token && token !== id);
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
};
