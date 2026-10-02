// Local fixtures, shared by the table, summary, and plan distribution.
export const plans = [
  { id: 'starter', name: 'Starter', price: 29 },
  { id: 'studio', name: 'Studio', price: 79 },
  { id: 'business', name: 'Business', price: 149 },
];

export const customers = [
  ['Sophie Chen', 'sophie@studionorth.example', 'Studio North', 'business', 'active', '2026-09-29'],
  ['Oliver Park', 'oliver@fieldwork.example', 'Fieldwork', 'studio', 'trial', '2026-09-27'],
  ['Mia Patel', 'mia@daybreak.example', 'Daybreak', 'studio', 'active', '2026-09-24'],
  ['Noah Williams', 'noah@arc.example', 'Arc & Co.', 'starter', 'active', '2026-09-20'],
  ['Emma Wilson', 'emma@paperplane.example', 'Paper Plane', 'business', 'active', '2026-09-18'],
  ['Lucas Martin', 'lucas@common.example', 'Common Ground', 'starter', 'trial', '2026-09-15'],
  ['Ava Thompson', 'ava@atlas.example', 'Atlas', 'studio', 'active', '2026-09-11'],
  ['Ethan Lee', 'ethan@form.example', 'Form Studio', 'business', 'paused', '2026-09-06'],
  ['Isabella Garcia', 'isabella@kindred.example', 'Kindred', 'business', 'active', '2026-08-28'],
  ['James Brown', 'james@bright.example', 'Bright Ideas', 'starter', 'active', '2026-08-22'],
  ['Amelia Davis', 'amelia@coast.example', 'Coast', 'studio', 'active', '2026-08-17'],
  ['Benjamin Kim', 'benjamin@outline.example', 'Outline', 'business', 'trial', '2026-08-12'],
  ['Charlotte Miller', 'charlotte@slow.example', 'Slow Sunday', 'starter', 'active', '2026-08-05'],
  ['Henry Anderson', 'henry@pixel.example', 'Pixel Works', 'studio', 'paused', '2026-07-26'],
  ['Harper Taylor', 'harper@made.example', 'Made Together', 'business', 'active', '2026-07-18'],
  ['Leo Thomas', 'leo@open.example', 'Open House', 'studio', 'active', '2026-07-09'],
  ['Evelyn Moore', 'evelyn@good.example', 'Good Company', 'starter', 'trial', '2026-06-24'],
  ['Jack White', 'jack@hello.example', 'Hello Tomorrow', 'business', 'active', '2026-06-16'],
  ['Abigail Harris', 'abigail@wild.example', 'Wildflower', 'studio', 'active', '2026-06-08'],
  ['Daniel Clark', 'daniel@new.example', 'New Chapter', 'starter', 'active', '2026-06-02'],
].map(([name, email, company, plan, status, joined], index) => ({
  id: `cus_${1001 + index}`, name, email, company, plan, status, joined,
  notes: index === 0 ? 'Annual review scheduled for October. Prefers email updates.' : '',
  updates: index === 0,
}));

// Historical snapshots are independent of the editable, current customer list.
export const revenue = [
  { month: 'Apr', label: 'April 2026', value: 980 },
  { month: 'May', label: 'May 2026', value: 1118 },
  { month: 'Jun', label: 'June 2026', value: 1208 },
  { month: 'Jul', label: 'July 2026', value: 1327 },
  { month: 'Aug', label: 'August 2026', value: 1498 },
  { month: 'Sep', label: 'September 2026', value: 1717 },
];
