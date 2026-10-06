/*
 * The Settings example's System pages: Status (is everything working, and the fix where it isn't)
 * and Logs (what happened). Sample data only; actions change it locally.
 */
export const systemInfo = [
  ['App Version', '2.9.0'],
  ['Database', 'MariaDB 11.8'],
  ['PHP', '8.5.4'],
  ['Web Server', 'nginx 1.28'],
  ['Time Zone', 'Europe/Amsterdam'],
  ['Maximum Upload Size', '20 MB'],
];

export const requirements = [
  {
    name: 'PHP Extensions',
    summary: 'All 20 installed',
  },
  { name: 'PHP Functions', summary: 'All 9 available' },
  {
    name: 'Folders',
    summary: 'All 6 writable',
  },
];

export const tasks = [
  { id: 'fetch', name: 'Fetch Emails', detail: 'Checks the mailboxes every minute.' },
  { id: 'send', name: 'Send Emails', detail: 'Sends replies and notifications.', lastRun: 'Running' },
  { id: 'clean', name: 'Clean Up', detail: 'Removes expired drafts and logs.', lastRun: 'Last ran 2 hours ago' },
];

export const failedJobs = [
  {
    id: 41,
    title: 'Reply to Sophie Chen',
    conversation: 1042,
    error: 'The SMTP server didn’t answer within 30 seconds.',
    failed: 'Today, 9:12 AM',
  },
  {
    id: 42,
    title: 'Assignment email to Mia Patel',
    conversation: 1041,
    error: 'Mailbox rejected: quota exceeded.',
    failed: 'Today, 8:47 AM',
  },
];

const outgoing = [
  [
    'Oct 6, 09:12',
    'Reply',
    'sophie@example.com',
    'Not sent: the SMTP server didn’t answer within 30 seconds (smtp.forma.example:587). Retrying in 5 minutes.',
    1042,
  ],
  ['Oct 6, 08:58', 'Reply', 'jordan@example.com', 'Sent', 1041],
  [
    'Oct 6, 08:47',
    'Notification',
    'mia@forma.example',
    'Not sent: mailbox rejected the message because its quota is exceeded.',
    1041,
  ],
  ['Oct 6, 08:30', 'Auto Reply', 'emma@example.com', 'Sent', 1040],
  ['Oct 5, 17:02', 'Reply', 'daniel@example.com', 'Sent', 1039],
];
const sendErrors = outgoing.filter(entry => entry[3] !== 'Sent');
const fetchErrors = [
  [
    'Oct 6, 07:15',
    'Fetch',
    'billing@forma.example',
    'Couldn’t connect to imap.forma.example:993: the certificate has expired.',
    null,
  ],
];
const users = [
  ['Oct 6, 08:55', 'Signed In', 'Mia Patel', 'From 203.0.113.7 · Safari on macOS', null],
  ['Oct 6, 08:41', 'Changed Settings', 'Alex Morgan', 'Mail Settings: sending method', null],
  ['Oct 5, 18:20', 'Signed Out', 'Noah Williams', 'From 198.51.100.24', null],
];
const entries = rows =>
  rows.map(([date, type, who, status, conversation], id) => ({ id, date, type, who, status, conversation }));

export const logs = {
  outgoing: { label: 'Outgoing Emails', who: 'Recipient', entries: entries(outgoing) },
  'send-errors': { label: 'Send Errors', who: 'Recipient', entries: entries(sendErrors) },
  'fetch-errors': { label: 'Fetch Errors', who: 'Mailbox', entries: entries(fetchErrors) },
  users: { label: 'User Activity', who: 'User', entries: entries(users) },
  app: {
    label: 'App Logs',
    files: {
      'laravel.log': [
        '[2026-10-06 09:12:04] production.ERROR: Connection could not be established with host smtp.forma.example:587',
        '[2026-10-06 08:47:31] production.WARNING: Mailbox quota exceeded for mia@forma.example',
        '[2026-10-06 07:15:09] production.ERROR: IMAP certificate expired for imap.forma.example',
      ],
      'queue-jobs.log': [
        '[2026-10-06 09:12:04] Processing: App\\Jobs\\SendReplyToCustomer',
        '[2026-10-06 09:12:34] Failed: App\\Jobs\\SendReplyToCustomer',
      ],
    },
  },
};
