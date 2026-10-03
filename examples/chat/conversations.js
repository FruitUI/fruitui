const notesUrl = new URL('./interaction-notes.txt', import.meta.url).href;

export const people = [
  { id: 'alex', name: 'Alex Morgan', initials: 'AM', role: 'Design', available: true },
  { id: 'sophie', name: 'Sophie Chen', initials: 'SC', role: 'Design', available: true },
  { id: 'mia', name: 'Mia Patel', initials: 'MP', role: 'Product', available: true },
  { id: 'noah', name: 'Noah Williams', initials: 'NW', role: 'Engineering', available: true },
  { id: 'oliver', name: 'Oliver Park', initials: 'OP', role: 'Design', available: false },
];

const message = (id, authorId, body, time, extra = {}) => ({
  id,
  authorId,
  body,
  time,
  unread: false,
  reactions: [],
  replies: [],
  ...extra,
});
const team = ['alex', 'sophie', 'mia', 'noah', 'oliver'];

export const rooms = [
  {
    id: 'general',
    kind: 'channel',
    name: 'general',
    description: 'A place for everyone. News, small wins, and good mornings.',
    members: team,
    messages: [
      message(
        101,
        'mia',
        'Good morning, everyone! A fresh month, a little cooler outside, and some good things taking shape. ☀️',
        '9:02 AM',
      ),
      message(
        102,
        'noah',
        'The new workspace is ready for a first look. Everything feels a little lighter already.',
        '9:14 AM',
        {
          unread: true,
          replies: [message(110, 'sophie', 'Just tried it on my phone. The navigation feels lovely.', '9:18 AM')],
        },
      ),
      message(
        103,
        'oliver',
        'Friday coffee at 11? I’ll bring something from the bakery around the corner.',
        '9:28 AM',
        { unread: true, reactions: [{ emoji: '👍', people: ['mia', 'sophie'] }] },
      ),
    ],
  },
  {
    id: 'design',
    kind: 'channel',
    name: 'design',
    description: 'The details that make a difference.',
    members: team,
    messages: [
      message(
        201,
        'mia',
        'A little space for the things we’re making. Early ideas, tiny details, and anything that makes an interface feel more human.',
        '9:08 AM',
        { reactions: [{ emoji: '✨', people: ['sophie', 'noah', 'oliver'] }] },
      ),
      message(
        202,
        'sophie',
        'I’ve been exploring the mobile conversation view. The idea is to keep the conversation in focus, with threads just one tap away. A few notes to start us off.',
        '9:16 AM',
        {
          attachment: { title: 'Interaction notes', detail: 'Plain text document', url: notesUrl },
          reactions: [{ emoji: '👍', people: ['mia', 'noah'] }],
          replies: [
            message(210, 'mia', 'Love the direction. Could we keep the draft when someone opens a thread?', '9:20 AM'),
            message(
              211,
              'alex',
              'Yes — each conversation and thread gets its own draft. It should feel like picking up right where you left off.',
              '9:24 AM',
            ),
          ],
        },
      ),
      message(
        203,
        'alex',
        'The quiet details matter: familiar controls, enough room to breathe, and a clear way back. That feels like a good foundation.',
        '9:31 AM',
      ),
      message(
        204,
        'noah',
        'The first build follows the system appearance automatically. Light and dark get the same care.',
        '9:38 AM',
        { reactions: [{ emoji: '👍', people: ['alex', 'sophie'] }] },
      ),
      message(
        205,
        'oliver',
        'I’ll bring the typography explorations to our review. Looking forward to seeing all the pieces together.',
        '9:42 AM',
      ),
    ],
  },
  {
    id: 'engineering',
    kind: 'channel',
    name: 'engineering',
    description: 'Build notes, small improvements, and things worth sharing.',
    members: ['alex', 'mia', 'noah', 'sophie'],
    messages: [
      message(
        301,
        'noah',
        'The keyboard pass is ready. Enter sends a message; Shift + Enter makes a new line. Native controls do the rest.',
        '9:12 AM',
        { unread: true },
      ),
      message(
        302,
        'alex',
        'Let’s give the narrow layouts a little extra attention today. A thread should fit inside a panel as well as a whole screen.',
        '9:25 AM',
        {
          unread: true,
          replies: [
            message(
              310,
              'noah',
              'Added a 320px container to the checks. The composer and navigation still fit.',
              '9:30 AM',
            ),
          ],
        },
      ),
    ],
  },
  {
    id: 'random',
    kind: 'channel',
    name: 'random',
    description: 'The good things between the work.',
    members: team,
    messages: [
      message(
        401,
        'oliver',
        'A tiny recommendation: take the long way home today. The leaves in the park are looking particularly good. 🍂',
        '8:56 AM',
      ),
      message(402, 'mia', 'Excellent advice. Adding a coffee stop to that plan.', '9:04 AM', {
        reactions: [{ emoji: '❤️', people: ['oliver'] }],
      }),
    ],
  },
  {
    id: 'dm-sophie',
    kind: 'dm',
    personId: 'sophie',
    name: 'Sophie Chen',
    description: 'A conversation with Sophie Chen.',
    members: ['alex', 'sophie'],
    messages: [
      message(501, 'alex', 'Hey Sophie! Thanks for putting the interaction notes together.', '8:48 AM'),
      message(
        502,
        'sophie',
        'Of course! I’d love a second pair of eyes on the mobile navigation when you have a moment.',
        '9:10 AM',
        { unread: true },
      ),
    ],
  },
  {
    id: 'dm-mia',
    kind: 'dm',
    personId: 'mia',
    name: 'Mia Patel',
    description: 'A conversation with Mia Patel.',
    members: ['alex', 'mia'],
    messages: [
      message(601, 'alex', 'Are we still on for the design review this afternoon?', '8:42 AM'),
      message(
        602,
        'mia',
        'Yes! 2 PM. Bring the new conversation view — I think the team will love the direction.',
        '9:06 AM',
        { unread: true },
      ),
    ],
  },
  {
    id: 'dm-noah',
    kind: 'dm',
    personId: 'noah',
    name: 'Noah Williams',
    description: 'A conversation with Noah Williams.',
    members: ['alex', 'noah'],
    messages: [
      message(
        701,
        'noah',
        'The latest build is ready whenever you are. Thanks for the thoughtful feedback yesterday.',
        'Yesterday',
      ),
    ],
  },
];
