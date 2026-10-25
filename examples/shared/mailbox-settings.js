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

/**
 * A mailbox's pages, in the order its settings list them: its own, its channels (email is one, which
 * a mailbox may not have), the messages it sends by itself on every channel, then its AI Assistant.
 */
export const mailboxPages = {
  general: 'General',
  permissions: 'Permissions',
  email: 'Email',
  webchat: 'Website Chat',
  telegram: 'Telegram',
  greeting: 'Greeting',
  'auto-reply': 'Auto Reply',
  ai: 'AI Assistant',
};
export const mailboxPageGroups = [
  { title: '', pages: ['general', 'permissions'] },
  { title: 'Channels', pages: ['email', 'webchat', 'telegram'] },
  { title: 'Automatic Messages', pages: ['greeting', 'auto-reply'] },
  { title: '', pages: ['ai'] },
];
/** Pages of earlier versions: Connection is Email's now. */
export const mailboxPageAliases = { connection: 'email' };
export const mailboxPage = page => (mailboxPages[page] ? page : (mailboxPageAliases[page] ?? ''));

/**
 * The channels, and the messages each can send by itself: every channel replies automatically to a
 * customer's first message; a greeting needs a channel that shows something before they write, and
 * says how it shows it.
 */
export const channels = {
  email: { name: 'Email', greets: false, subject: true },
  webchat: { name: 'Website Chat', greets: 'Shown when a visitor opens the chat.', subject: false },
  telegram: {
    name: 'Telegram',
    greets: 'Sent when the customer taps Start, and shown in the empty chat.',
    subject: false,
  },
};
/** A channel's own message: the mailbox's (the default), its own, or none. */
export const channelModes = { mailbox: 'The Mailbox’s', own: 'Its Own', none: 'None' };
export const greetingModes = { builtin: 'Built-in', own: 'Your Own', none: 'Off' };
const version = (language, message, subject = '') => ({ language, subject, message });
const channelMessages = () =>
  Object.fromEntries(Object.keys(channels).map(key => [key, { mode: 'mailbox', versions: [] }]));

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
  webchat: { enabled: false, websites: '' },
  telegram: { enabled: false, token: '' },
  // Before the customer writes, on the channels that can show it: the built-in greeting (in their
  // language), the mailbox's own, or none; each such channel may have its own instead.
  greeting: {
    mode: 'builtin',
    versions: [version('default', 'Hi {%customer.first_name%}! How can we help?')],
    channels: channelMessages(),
  },
  // After a customer's first message in a new conversation, on every channel, in their language if
  // the mailbox has it (else Default); each channel may have its own instead, or none.
  autoReply: {
    on: false,
    versions: [
      version(
        'default',
        'Hi {%customer.first_name%},\n\nThanks for writing. We usually reply **within a day**.',
        'We received your message',
      ),
    ],
    channels: channelMessages(),
  },
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
export const sampleMailboxes = () => {
  const support = mailboxSettings('Support', 'support@forma.example', 'blue', {
    webchat: { enabled: true, websites: 'https://forma.example' },
    telegram: { enabled: true, token: '7420019:AAH-sample' },
  });
  // Telegram's bot greets in its own words.
  support.greeting.channels.telegram = {
    mode: 'own',
    versions: [version('default', 'Hi! This is Forma Support. Write your question and we’ll answer here.')],
  };
  const billing = mailboxSettings('Billing', 'billing@forma.example', 'green', {
    agents: ['alex'],
    webchat: { enabled: true, websites: 'https://forma.example/billing' },
    aiLanguage: 'nl',
    chatTranslation: true,
  });
  billing.autoReply.on = true;
  billing.autoReply.versions.push(
    version(
      'nl',
      'Hoi {%customer.first_name%},\n\nBedankt voor je bericht. We antwoorden meestal **binnen een dag**.',
      'We hebben je bericht ontvangen',
    ),
  );
  // A chat is answered live: no auto reply there.
  billing.autoReply.channels.webchat.mode = 'none';
  const feedback = mailboxSettings('Feedback', 'feedback@forma.example', 'purple', {
    sending: 'php',
    agents: ['alex', 'mia', 'noah'],
    aiSummaries: false,
    aiTranslations: false,
    aiDrafts: false,
  });
  return { support, billing, feedback };
};

/** The installation's default language, which a mailbox's Default follows. */
export const defaultLanguage = 'en';

export const people = box => (box.agents.length === 1 ? '1 person' : `${box.agents.length} people`);

/** A mailbox's AI Assistant at a glance: its language while any feature is on. */
export const aiSummary = (box, fallback = defaultLanguage) => {
  if (![box.aiSummaries, box.aiTranslations, box.aiDrafts, box.chatTranslation].some(Boolean)) return 'Off';
  return `On · ${languages[box.aiLanguage === 'default' ? fallback : box.aiLanguage]}`;
};

/** Whether the mailbox has a channel set up: email needs its address. */
export const hasChannel = (box, key) => (key === 'email' ? Boolean(box.email) : Boolean(box[key]?.enabled));

/** The current value a mailbox's row shows for one of its pages. */
export const pageSummary = (box, page) => {
  if (page === 'general') return '';
  if (page === 'permissions') return people(box);
  if (page === 'email') return box.email || 'Not set up';
  if (page === 'webchat') return box.webchat.enabled ? 'On' : 'Off';
  if (page === 'telegram') return box.telegram.enabled ? 'Connected' : 'Not set up';
  if (page === 'greeting') return greetingModes[box.greeting.mode];
  if (page === 'auto-reply') return box.autoReply.on ? 'On' : 'Off';
  return aiSummary(box);
};

/** A language version's text on one line, for its row: enough to see which versions were updated. */
export const oneLine = text =>
  (text ?? '')
    .split('\n')
    .map(line =>
      line
        .replace(/^[#>\s]+/, '')
        .replace(/[*`]/g, '')
        .trim(),
    )
    .filter(Boolean)
    .join(' ');

/**
 * What the AI would return for Translate from Default, for the sample texts; other text comes back
 * marked, as a stand-in. A server asks its AI provider instead.
 */
const sampleTranslations = {
  nl: [
    [
      'Thanks for writing. We usually reply **within a day**.',
      'Bedankt voor je bericht. We antwoorden meestal **binnen een dag**.',
    ],
    ['We received your message', 'We hebben je bericht ontvangen'],
    ['How can we help?', 'Waarmee kunnen we helpen?'],
    ['Hi ', 'Hoi '],
  ],
  de: [
    [
      'Thanks for writing. We usually reply **within a day**.',
      'Danke für Ihre Nachricht. Wir antworten meist **innerhalb eines Tages**.',
    ],
    ['We received your message', 'Wir haben Ihre Nachricht erhalten'],
    ['How can we help?', 'Wie können wir helfen?'],
    ['Hi ', 'Hallo '],
  ],
};
export const translateSample = (text, language) => {
  let result = text ?? '';
  const pairs = sampleTranslations[language];
  if (!pairs) return result && `[${languages[language]}] ${result}`;
  for (const [english, translated] of pairs) result = result.replace(english, translated);
  return result;
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
