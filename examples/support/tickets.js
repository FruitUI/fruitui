const people = {
  sophie: {
    name: 'Sophie Chen',
    email: 'sophie@example.com',
    initials: 'SC',
    company: 'Studio North',
    plan: 'Team',
    members: 12,
    since: 'March 2024',
    location: 'Portland, Oregon',
  },
  jordan: {
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    initials: 'JL',
    company: 'Fieldwork',
    plan: 'Business',
    members: 24,
    since: 'June 2023',
    location: 'London, UK',
  },
  emma: {
    name: 'Emma Thompson',
    email: 'emma@example.com',
    initials: 'ET',
    company: 'Gather Studio',
    plan: 'Team',
    members: 8,
    since: 'January 2025',
    location: 'Copenhagen, Denmark',
  },
  daniel: {
    name: 'Daniel Brooks',
    email: 'daniel@example.com',
    initials: 'DB',
    company: 'Good Measure',
    plan: 'Team',
    members: 6,
    since: 'April 2024',
    location: 'Austin, Texas',
  },
  maya: {
    name: 'Maya Rodriguez',
    email: 'maya@example.com',
    initials: 'MR',
    company: 'Common Ground',
    plan: 'Business',
    members: 18,
    since: 'August 2023',
    location: 'Barcelona, Spain',
  },
  oliver: {
    name: 'Oliver Park',
    email: 'oliver@example.com',
    initials: 'OP',
    company: 'Made by Oliver',
    plan: 'Personal',
    members: 1,
    since: 'February 2025',
    location: 'Seoul, South Korea',
  },
  lena: {
    name: 'Lena Wilson',
    email: 'lena@example.com',
    initials: 'LW',
    company: 'Small Hours',
    plan: 'Team',
    members: 4,
    since: 'May 2025',
    location: 'Melbourne, Australia',
  },
};

function customer(body, time = 'Today, 10:42 AM') {
  return { kind: 'customer', author: '', time, body };
}
function note(body, time = 'Today, 10:48 AM') {
  return { kind: 'note', author: 'Mia Patel', time, body };
}
function event(body, time) {
  return { kind: 'event', author: '', time, body };
}
function reply(body, time, author = 'Alex Morgan') {
  return { kind: 'reply', author, time, body };
}
/** Generated text that is not sent, such as a summary or a translation. */
function summary(body, time) {
  return { kind: 'summary', author: 'Assistant', time, body };
}

export const tickets = [
  {
    id: 1042,
    mailboxId: 'billing',
    customer: people.sophie,
    subject: 'A little help with our team plan',
    status: 'open',
    assignee: 'alex',
    priority: 'normal',
    unread: false,
    time: '12m',
    tags: ['Billing', 'Team Plan'],
    preview: 'One of our freelancers says her invite link has expired.',
    threads: [
      customer(
        'Hi there,\n\nWe’re growing the studio and would love to bring all 12 of us into Forma. Can we move to the Team plan without losing our projects?\n\nAlso, is it possible to pay annually? Thanks for making a tool we love using.\n\nSophie',
        'Yesterday, 4:12 PM',
      ),
      note(
        'They’re bringing the whole studio over next week. Existing projects stay in place when upgrading. Annual billing is available on the Team plan.',
        'Yesterday, 4:20 PM',
      ),
      reply(
        'Hi Sophie,\n\nWelcome to the Team plan, all twelve of you! Upgrading keeps every project, comment and file exactly where it is.\n\nAnnual billing is available and saves two months compared with paying monthly. You can switch in Settings › Billing, or Alex on our billing team can make the change for you.\n\nMia',
        'Yesterday, 4:51 PM',
        'Mia Patel',
      ),
      event('Mia Patel assigned this to Alex Morgan', 'Yesterday, 4:52 PM'),
      customer(
        'Thanks Mia, that’s great news.\n\nCould you make the switch for us? And one more question: three of our freelancers only need to comment on projects. Do they need full seats?\n\nSophie',
        'Today, 9:58 AM',
      ),
      event('Alex Morgan upgraded the plan to Team', '10:20 AM'),
      reply(
        'All done. Studio North is on the Team plan with annual billing, and the new invoice is in Settings › Billing.\n\nFreelancers who only comment can join as guests. Guests are free, and they can view and comment on the projects you share with them.\n\nAlex',
        'Today, 10:24 AM',
      ),
      customer(
        'Perfect, thank you! I’ve invited the freelancers as guests, but Ana says her invite link has expired. Could you send her a fresh one?\n\nSophie',
      ),
      summary(
        'Studio North moved to the Team plan with annual billing. Sophie invited three freelancers as guests; one invite link expired and needs to be sent again.',
        'Today, 10:43 AM',
      ),
    ],
  },
  {
    id: 1041,
    mailboxId: 'support',
    customer: people.jordan,
    subject: 'Sign-in after changing our domain',
    status: 'open',
    assignee: '',
    priority: 'high',
    unread: true,
    time: '28m',
    tags: ['Account', 'SSO'],
    preview: 'Our new domain is live, but a few teammates can’t sign in with SSO.',
    threads: [
      customer(
        'Hello,\n\nWe changed our company domain this morning. A few teammates are having trouble signing in with SSO. Can you help us update the workspace settings?\n\nJordan',
        'Today, 10:26 AM',
      ),
      {
        ...reply(
          'Hi Jordan,\n\nI’ve added your new domain to the workspace’s single sign-on settings. The attached notes show where to confirm it on your side.\n\nAlex',
          'Today, 10:31 AM',
        ),
        attachments: [{ name: 'sso-setup-notes.txt', size: '1 KB', href: 'attachments/fruitui-design-notes.txt' }],
        // A reply the mail server refused: shown as one status line with Retry and View log.
        delivery: {
          tone: 'danger',
          text: 'Not sent: the mail server refused the connection.',
          log: 'mail(): Sendmail exited with non-zero exit code 127',
        },
      },
    ],
  },
  {
    id: 1040,
    mailboxId: 'support',
    customer: people.emma,
    subject: 'A new home for our workspace',
    status: 'open',
    assignee: 'alex',
    priority: 'normal',
    unread: true,
    time: '46m',
    tags: ['Workspace'],
    preview: 'Vi er ved at oprette et separat workspace til vores nye studie.',
    threads: [
      {
        ...customer(
          'Hej,\n\nVi er ved at oprette et separat workspace til vores nye studie. Hvad er den nemmeste måde at flytte vores projekter på, så kommentarerne følger med?\n\nTak,\nEmma',
          'Today, 10:08 AM',
        ),
        // A machine translation shown with the message it translates.
        lang: 'da',
        translation:
          'Hi,\n\nWe’re setting up a separate workspace for our new studio. What’s the easiest way to move our projects so the comments come along?\n\nThanks,\nEmma',
      },
    ],
  },
  {
    id: 1039,
    mailboxId: 'billing',
    customer: people.daniel,
    subject: 'An invoice for our finance team',
    status: 'waiting',
    assignee: 'mia',
    priority: 'normal',
    unread: false,
    time: '1h',
    tags: ['Billing'],
    preview: 'Thanks! I’m checking the billing details with our finance team.',
    threads: [
      customer('Could you send us an invoice with our company name and VAT number?', 'Today, 9:20 AM'),
      {
        kind: 'reply',
        author: 'Mia Patel',
        time: 'Today, 9:32 AM',
        body: 'Of course. Please send your company name, billing address, and VAT number. I’ll update the invoice for you.',
      },
      customer('Thanks! I’m checking the billing details with our finance team.', 'Today, 9:54 AM'),
    ],
  },
  {
    id: 1038,
    mailboxId: 'support',
    customer: people.maya,
    subject: 'Our project export is missing files',
    status: 'open',
    assignee: 'mia',
    priority: 'urgent',
    unread: true,
    time: '1h',
    tags: ['Export', 'Bug'],
    preview: 'A few attachments didn’t make it into our export. We have a handoff today.',
    threads: [
      customer(
        'Hi,\n\nOur project export is missing a few attachments. We have a client handoff this afternoon and need the original files. I can send the project link if that helps.\n\nMaya',
        'Today, 9:48 AM',
      ),
      note(
        'Reproduced with large attachments. Engineering is checking the export job. Ask for the project link and offer individual downloads in the meantime.',
        'Today, 9:52 AM',
      ),
    ],
  },
  {
    id: 1037,
    mailboxId: 'feedback',
    customer: people.oliver,
    subject: 'Just wanted to say thank you',
    status: 'open',
    assignee: '',
    priority: 'normal',
    unread: false,
    time: '2h',
    tags: ['Feedback'],
    preview: 'The little improvements in the latest update made my day.',
    threads: [
      customer(
        'Hello Forma team,\n\nThe little improvements in the latest update made my day. The new project overview is exactly what I was hoping for. Keep making good things!\n\nOliver',
        'Today, 8:54 AM',
      ),
    ],
  },
  {
    id: 1036,
    mailboxId: 'support',
    customer: people.lena,
    subject: 'Inviting a client as a guest',
    status: 'waiting',
    assignee: 'alex',
    priority: 'normal',
    unread: false,
    time: '3h',
    tags: ['Workspace', 'Guests'],
    preview: 'I’ll give that a try with our next client project. Thank you!',
    threads: [
      customer('Can we invite a client to one project without giving them access to everything?', 'Today, 7:34 AM'),
      {
        kind: 'reply',
        author: 'Alex Morgan',
        time: 'Today, 7:48 AM',
        body: 'Yes! Invite them as a guest from the project’s Share menu. They’ll only see that project, and you can adjust their permissions at any time.',
      },
      customer('I’ll give that a try with our next client project. Thank you!', 'Today, 7:54 AM'),
    ],
  },
  {
    id: 1035,
    mailboxId: 'billing',
    customer: people.sophie,
    subject: 'A copy of last month’s invoice',
    status: 'closed',
    assignee: 'alex',
    priority: 'normal',
    unread: false,
    time: 'Yesterday',
    tags: ['Billing'],
    preview: 'That’s perfect. Thanks for the quick help!',
    threads: [
      customer('Hi! Could you send me a copy of last month’s invoice?', 'Yesterday, 2:15 PM'),
      {
        kind: 'reply',
        author: 'Alex Morgan',
        time: 'Yesterday, 2:28 PM',
        body: 'Hi Sophie, you can download it from Settings → Billing → Invoices. I’ve also added your billing contact so they’ll receive future invoices automatically.',
      },
      customer('That’s perfect. Thanks for the quick help!', 'Yesterday, 2:40 PM'),
    ],
  },
  {
    id: 1034,
    mailboxId: 'feedback',
    customer: people.lena,
    subject: 'A small idea for project templates',
    status: 'open',
    assignee: 'noah',
    priority: 'normal',
    unread: false,
    time: 'Yesterday',
    tags: ['Feedback'],
    preview: 'It would be lovely to save a project checklist as a reusable template.',
    threads: [
      customer(
        'Hi team,\n\nWe use the same checklist for every new project. It would be lovely to save it as a template and bring it into a project with one click.\n\nJust a thought!\nLena',
        'Yesterday, 4:20 PM',
      ),
    ],
  },
];

export const queues = [
  { id: 'open', label: 'Open', icon: 'inbox' },
  { id: 'mine', label: 'Assigned to Me', icon: 'person' },
  { id: 'unassigned', label: 'Unassigned', icon: 'tray' },
  { id: 'waiting', label: 'Waiting', icon: 'clock' },
  { id: 'closed', label: 'Closed', icon: 'check-circle' },
];

export const agents = [
  { id: 'alex', name: 'Alex Morgan' },
  { id: 'mia', name: 'Mia Patel' },
  { id: 'noah', name: 'Noah Williams' },
];

export const mailboxes = [
  { id: 'support', name: 'Support', email: 'support@forma.example' },
  { id: 'billing', name: 'Billing', email: 'billing@forma.example' },
  { id: 'feedback', name: 'Feedback', email: 'feedback@forma.example' },
];
