/*
 * Kova interactive prototype.
 *
 * One in-memory state (S), a path router (the address is the source of truth, as it is in Kova, so a
 * narrowed list is a link), and an action map (A) wired to `data-act` attributes. Navigation uses
 * `data-go="/path"`. Everything resets on reload.
 *
 * The data mirrors the monorepo's sample seed (supabase/seeds): the five people, the Projects, and the
 * Dalqen issues keep their seeded titles, statuses and priorities.
 */
(() => {
  'use strict';

  const EMBEDDED = window.self !== window.top;
  const TODAY = '2026-10-16';
  const ME = 'kd';

  // ------------------------------------------------------------------ data --

  const people = {
    kd:   { name: 'Kova Developer', ini: 'KD', email: 'developer@xkye.dev', owner: true,  status: 'active',    color: '#0449D4', last: 'Now' },
    ada:  { name: 'Ada Admin',      ini: 'AA', email: 'ada@xkye.dev',       owner: true,  status: 'active',    color: '#7a52a0', last: '12 min ago' },
    mira: { name: 'Mira Member',    ini: 'MM', email: 'mira@xkye.dev',      owner: false, status: 'active',    color: '#3b7253', last: '1 hour ago' },
    pat:  { name: 'Pat Pending',    ini: 'PP', email: 'pat@xkye.dev',       owner: false, status: 'invited',   color: '#6f6e69', last: 'Never', expired: true },
    sam:  { name: 'Sam Suspended',  ini: 'SS', email: 'sam@xkye.dev',       owner: false, status: 'suspended', color: '#c0392f', last: '4 Aug', suspendedDays: 64 },
  };

  const projects = [
    { key: 'DAL', name: 'Dalqen', status: 'active', color: '#0449D4', summary: 'The product the studio dogfoods Kova with.', desc: 'Research, build, and ship the first usable spine. Every issue here is a piece of the product the studio dogfoods Kova with.', members: ['kd', 'ada', 'mira'] },
    { key: 'REN', name: 'Renigo', status: 'active', color: '#3b7253', summary: 'A client engagement, delivered in slices.', desc: 'The Renigo data platform, delivered in slices with the client reading the board beside us.', members: ['kd', 'ada', 'mira'] },
    { key: 'INT', name: 'Internal', status: 'active', color: '#7a52a0', summary: 'How the studio runs itself.', desc: 'Onboarding, tooling, and the paperwork nobody wants to own.', members: ['kd', 'ada', 'mira'] },
    { key: 'FOR', name: 'Forge Events', status: 'planned', color: '#c26a0d', summary: 'Registration, scheduling and run sheets.', desc: 'The events platform: registration, scheduling, and the run sheets the crew works from on the day.', members: ['kd', 'ada'] },
    { key: 'ATL', name: 'Atlas handover', status: 'paused', color: '#6f6e69', summary: 'What is left to hand over.', desc: 'Paused while the client reorganises.', members: ['kd', 'ada'] },
    { key: 'LEG', name: 'Legacy portal', status: 'completed', color: '#8a5a44', summary: 'The intranet the studio replaced.', desc: 'Kept as a record of what was migrated and what was deliberately dropped.', members: ['kd', 'ada'] },
    { key: 'ORB', name: 'Orbital experiment', status: 'cancelled', color: '#ad3f7a', summary: 'An idea that did not survive a spike.', desc: '', members: ['kd', 'ada'] },
  ];
  const nextNumber = { DAL: 13, REN: 8, INT: 5, FOR: 1, ATL: 3, LEG: 3, ORB: 2 };

  const sprints = {
    'DAL-S3': { id: 'DAL-S3', project: 'DAL', name: 'Sprint 3', range: '22 Sep – 5 Oct', state: 'completed' },
    'DAL-S4': { id: 'DAL-S4', project: 'DAL', name: 'Sprint 4', range: '6 Oct – 19 Oct', state: 'running' },
    'DAL-S5': { id: 'DAL-S5', project: 'DAL', name: 'Sprint 5', range: '20 Oct – 2 Nov', state: 'planned' },
    'REN-S2': { id: 'REN-S2', project: 'REN', name: 'Slice 2', range: '29 Sep – 19 Oct', state: 'running' },
    'INT-S1': { id: 'INT-S1', project: 'INT', name: 'October', range: '1 Oct – 31 Oct', state: 'running' },
  };

  const DAL1_MD = `<h2>Why</h2><p>The daily work path needs an issue to read, so this fixture is what the local stack has to show until creation lands.</p><ul><li><strong>Status</strong> changes arrive with KOV-019.</li><li>Comments arrive with KOV-020.</li></ul><p>The detail view renders this Markdown, so it exercises a heading, a list, bold text, <code>inline code</code>, and a <a href="#">link</a>.</p><pre>kova issue dal-1</pre>`;

  const I = (id, title, status, priority, assignee, o = {}) => ({
    id, project: id.split('-')[0], number: +id.split('-')[1], title, status, priority, assignee,
    labels: o.labels || [], due: o.due || null, sprint: o.sprint || null, est: o.est ?? null,
    desc: o.desc || '', comments: o.comments || [], log: o.log || [], created: o.created || '2 Oct',
  });

  const issues = [
    I('DAL-1', 'Ship the issue read slice', 'in_progress', 'high', 'mira', { labels: ['web', 'api'], due: '2026-10-17', sprint: 'DAL-S4', est: 5, desc: DAL1_MD, created: '17 Aug',
      comments: [
        { who: 'ada', when: '2 days ago', text: 'The read slice is the spine everything else hangs off. Let’s keep the Markdown renderer strict.' },
        { who: 'mira', when: 'Yesterday', text: 'Agreed. I’ve pinned the fixture so DAL-1 stays a published address in the README and the CLI help.' },
      ],
      log: [{ who: 'kd', text: 'created the issue', when: '17 Aug' }, { who: 'kd', text: 'assigned it to Mira Member', when: '6 Oct' }, { who: 'mira', text: 'moved it to In progress', when: '7 Oct' }] }),
    I('DAL-2', 'Render Markdown safely', 'todo', 'none', null, { labels: ['web'], est: 2 }),
    I('DAL-3', 'Make the issue list keyboard navigable', 'in_progress', 'high', ME, { labels: ['web'], due: '2026-10-19', sprint: 'DAL-S4', est: 3,
      desc: '<p>Arrow keys and <code>j</code>/<code>k</code> move through the list, <code>Enter</code> opens the issue, and focus is never lost to the page when the list re-renders.</p>' }),
    I('DAL-4', 'Review the search projection design', 'in_review', 'medium', 'mira', { labels: ['db'], due: '2026-10-16', sprint: 'DAL-S4', est: 2 }),
    I('DAL-5', 'Unblock the local Supabase stack', 'blocked', 'urgent', ME, { labels: ['db'], due: '2026-10-14', sprint: 'DAL-S4', est: 3,
      desc: '<p>The stack refuses to start on a clean checkout: the storage container cannot reach the database on the pinned network.</p>' }),
    I('DAL-6', 'Archive the first milestone notes', 'done', 'low', 'ada', { labels: ['docs'], sprint: 'DAL-S3', est: 1 }),
    I('DAL-7', 'Retire the legacy board experiment', 'cancelled', 'none', null, { labels: [] }),
    I('DAL-8', 'Draft the CLI error contract', 'todo', 'medium', ME, { labels: ['cli', 'api'], due: '2026-10-22', sprint: 'DAL-S4', est: 3 }),
    I('DAL-9', 'Prove the end-to-end milestone', 'done', 'high', 'ada', { labels: ['web', 'cli'], sprint: 'DAL-S4', est: 8 }),
    I('DAL-10', 'Render the offline page in both themes', 'todo', 'low', null, { labels: ['web'], est: 2 }),
    I('DAL-11', 'Let a person name a Document Version', 'todo', 'medium', null, { labels: ['docs'], est: 3 }),
    I('DAL-12', 'Import a folder of Markdown as a Draft subtree', 'todo', 'high', null, { labels: ['docs'], est: 5 }),
    I('REN-1', 'Load the Renigo order history into the warehouse', 'in_progress', 'urgent', ME, { labels: ['client', 'db'], due: '2026-10-18', sprint: 'REN-S2', est: 5 }),
    I('REN-2', 'Write the reconciliation report the client signs', 'todo', 'medium', 'mira', { labels: ['client'], due: '2026-10-24', sprint: 'REN-S2', est: 3 }),
    I('REN-3', 'Decide what to do with the duplicate customer rows', 'blocked', 'high', 'ada', { labels: ['client'], sprint: 'REN-S2', est: 2 }),
    I('REN-4', 'Model the fulfilment funnel', 'in_review', 'medium', 'mira', { labels: ['db'], sprint: 'REN-S2', est: 3 }),
    I('REN-5', 'Agree the refresh cadence with the client', 'done', 'low', null, { labels: ['client'], est: 1 }),
    I('REN-6', 'Hand the pipeline over to the client’s analyst', 'todo', 'low', null, { labels: ['client'], est: 2 }),
    I('REN-7', 'Drop the abandoned CRM export spike', 'cancelled', 'none', null, {}),
    I('INT-1', 'Write the onboarding checklist a new joiner actually reads', 'todo', 'medium', 'ada', { labels: ['docs'], sprint: 'INT-S1', due: '2026-10-30' }),
    I('INT-2', 'Rotate the shared mailbox credentials', 'in_progress', 'high', ME, { sprint: 'INT-S1', due: '2026-10-20' }),
    I('INT-3', 'Decide whether the studio keeps a weekly demo', 'todo', 'low', 'mira', { sprint: 'INT-S1' }),
    I('INT-4', 'Retire the shared spreadsheet of client contacts', 'cancelled', 'low', null, {}),
    I('ATL-1', 'Write down what the Atlas client still has to run', 'in_review', 'high', 'ada', {}),
    I('ATL-2', 'Close the Atlas infrastructure account', 'todo', 'medium', null, {}),
  ];

  const STATUS = {
    todo:        { label: 'Todo',        icon: 'circle' },
    in_progress: { label: 'In progress', icon: 'progress' },
    in_review:   { label: 'In review',   icon: 'eye' },
    blocked:     { label: 'Blocked',     icon: 'alert-triangle' },
    done:        { label: 'Done',        icon: 'circle-check' },
    cancelled:   { label: 'Cancelled',   icon: 'circle-x' },
  };
  const PRIORITY = {
    urgent: { label: 'Urgent',      icon: 'alert-triangle' },
    high:   { label: 'High',        icon: 'arrow-up' },
    medium: { label: 'Medium',      icon: 'flag' },
    low:    { label: 'Low',         icon: 'arrow-down' },
    none:   { label: 'No priority', icon: 'minus' },
  };
  const PROJECT_STATUS = {
    planned: ['backlog', 'Planned'], active: ['in_progress', 'Active'], paused: ['blocked', 'Paused'],
    completed: ['done', 'Completed'], cancelled: ['cancelled', 'Cancelled'],
  };
  const OPEN = ['todo', 'in_progress', 'in_review', 'blocked'];

  const activity = [
    { who: 'mira', icon: 'eye', text: 'sent <b>DAL-4</b> for review', project: 'DAL', when: '18 min ago' },
    { who: 'ada', icon: 'circle-check', text: 'completed <b>DAL-9</b> Prove the end-to-end milestone', project: 'DAL', when: '1 hour ago' },
    { who: 'kd', icon: 'alert-triangle', text: 'marked <b>DAL-5</b> as Blocked', project: 'DAL', when: '3 hours ago' },
    { who: 'mira', icon: 'file-text', text: 'edited <b>Renigo data platform</b>', project: 'REN', when: 'Yesterday' },
    { who: 'ada', icon: 'message', text: 'commented on <b>DAL-1</b>', project: 'DAL', when: 'Yesterday' },
    { who: 'ada', icon: 'user-plus', text: 'assigned <b>REN-1</b> to Kova Developer', project: 'REN', when: '2 days ago' },
  ];

  const notifications = [
    { id: 'n1', who: 'mira', text: 'sent <b>DAL-4</b> Review the search projection design for your review', go: '/issues/DAL-4', when: '18 min ago', read: false },
    { id: 'n2', who: 'ada', text: 'assigned <b>REN-1</b> Load the Renigo order history into the warehouse to you', go: '/issues/REN-1', when: '2 days ago', read: false },
    { id: 'n3', who: 'ada', text: 'invited <b>pat@xkye.dev</b> to Kova', go: '/admin/members', when: '5 days ago', read: false },
    { id: 'n4', who: 'ada', text: 'assigned <b>DAL-5</b> Unblock the local Supabase stack to you', go: '/issues/DAL-5', when: '6 Oct', read: true },
  ];

  // ---- Kova Docs ----
  const spaces = [
    { project: 'DAL', slug: 'DAL', name: 'Dalqen' },
    { project: 'REN', slug: 'REN', name: 'Renigo' },
    { project: 'INT', slug: 'xkye-handbook', name: 'Xkye handbook' },
  ];
  const COVERS = [
    'linear-gradient(115deg,#032EA4 0%,#0449D4 38%,#0497F8 72%,#52DDFC 100%)',
    'linear-gradient(135deg,#06142D 0%,#0c2552 55%,#1F72FB 100%)',
    'linear-gradient(120deg,#e7f3f8 0%,#e9f2ff 50%,#ece6fd 100%)',
    'linear-gradient(120deg,#dcefe3 0%,#e7f3f8 100%)',
    '#fbecdd',
    '#06142D',
  ];
  const EMOJI = ['🧭', '🏛️', '📐', '🔎', '🗺️', '🧪', '📦', '🚀', '📝', '📚', '🧱', '⚙️', '🌱', '🛠️', '📊', '🧩', '💡', '✅', '🔐', '🗂️', '🛰️', '🎯', '🧵', '☕'];

  const docs = [
    { id: 'sprint-4-review', space: 'DAL', title: 'Sprint 4 review', icon: '🧭', cover: COVERS[0], parent: null, draft: true, author: ME, collaborators: ['mira'], star: true, edited: '4 min ago', recent: 1 },
    { id: 'architecture-overview', space: 'DAL', title: 'Architecture overview', icon: '🏛️', cover: COVERS[1], parent: null, draft: false, author: 'ada', star: true, edited: 'Yesterday', recent: 2 },
    { id: 'search-projection-notes', space: 'DAL', title: 'Search projection notes', icon: '🔎', cover: null, parent: 'architecture-overview', draft: false, author: 'mira', edited: '2 days ago', recent: 3 },
    { id: 'the-v1-content-model', space: 'DAL', title: 'The V1 content model', icon: '📐', cover: null, parent: 'architecture-overview', draft: false, author: 'kd', edited: '1 Oct' },
    { id: 'retired-board-experiment', space: 'DAL', title: 'Retired board experiment', icon: '🧪', cover: null, parent: null, draft: false, author: 'kd', edited: '22 Sep' },
    { id: 'renigo-data-platform', space: 'REN', title: 'Renigo data platform', icon: '📦', cover: COVERS[3], parent: null, draft: false, author: 'mira', edited: 'Yesterday', recent: 4 },
    { id: 'studio-handbook', space: 'xkye-handbook', title: 'Studio handbook', icon: '📚', cover: COVERS[2], parent: null, draft: false, author: 'ada', edited: '30 Sep', recent: 5 },
    { id: 'onboarding-checklist', space: 'xkye-handbook', title: 'Onboarding checklist', icon: '✅', cover: null, parent: 'studio-handbook', draft: false, author: 'ada', edited: '30 Sep' },
    { id: 'how-we-run-a-client-engagement', space: 'xkye-handbook', title: 'How we run a client engagement', icon: '🧵', cover: null, parent: 'studio-handbook', draft: false, author: 'kd', edited: '19 Sep' },
  ];

  const ref = (id) => `<span class="ref" contenteditable="false" data-ref="${id}" data-go="/issues/${id}"></span>`;
  const P = (html) => `<p contenteditable="true">${html}</p>`;
  const DOC_BODY = {
    'sprint-4-review': () => [
      `<div class="toc" contenteditable="false" data-toc></div>`,
      `<h2 contenteditable="true">Where the sprint stands</h2>`,
      P(`We committed to 24 points across six issues. The search projection ${ref('DAL-4')} is with <span class="mention">@Kova Developer</span> for review, and <mark class="anchor" data-thread="t1">the local stack is still blocked</mark> ${ref('DAL-5')}.`),
      `<div class="embed" contenteditable="false" data-embed="project=DAL&amp;placement=current&amp;status=todo,in_progress,in_review,blocked"></div>`,
      `<div class="callout" contenteditable="false"><span class="e">💡</span><div contenteditable="true">This list is an Embed, drawn live from a Filter. Move an issue on the board and it changes here without anyone editing the page.</div></div>`,
      `<h2 contenteditable="true">What we learned</h2>`,
      `<ul><li contenteditable="true">Keyboard navigation on the issue list needed a real focus model, not a tabindex on every row.</li><li contenteditable="true">Pinning the fixture made <code>DAL-1</code> a published address we can rely on in the docs and the CLI help.</li></ul>`,
      `<h3 contenteditable="true">Decisions</h3>`,
      P('Markdown renders through one strict pipeline, on the web and in the terminal.'),
      `<details class="toggle" contenteditable="false"><summary><i class="ti ti-chevron-right"></i> What we cut from this sprint</summary><div><p contenteditable="true">The graph database spike and a second board layout. Both are written down in Retired board experiment, so nobody has to rediscover why.</p></div></details>`,
      `<h2 contenteditable="true">Next sprint</h2>`,
      P('Sprint 5 starts on 20 October. Anything still open in the list above carries over.'),
    ].join(''),
    'architecture-overview': () => [
      `<div class="toc" contenteditable="false" data-toc></div>`,
      `<h2 contenteditable="true">One composition root</h2>`,
      P('The web application is the only place the system is assembled. It builds the database pool, the adapters, the use cases and the handlers once per process, and the CLI talks to the same server.'),
      `<h2 contenteditable="true">Use cases own behaviour</h2>`,
      P('Product behaviour lives in the application package, not in routes or handlers. A use case takes a resolved actor, reads and writes through repository interfaces the application owns, and returns a result.'),
      `<div class="callout" contenteditable="false"><span class="e">🔐</span><div contenteditable="true">Every request to /api/v1 has an actor. There is no development backdoor, and an unknown credential fails closed with its own error code.</div></div>`,
      `<h2 contenteditable="true">One contract for the browser and the terminal</h2>`,
      P(`The CLI and the browser cross the same versioned seam. Every response carries an API version and a request id, and failures share one error envelope. ${ref('DAL-8')} writes the CLI side of it down.`),
      `<h3 contenteditable="true">Row level security</h3>`,
      P('Grants and policies ship together in migrations. New tables are unreachable until a migration says otherwise, so a table someone forgets to grant stays closed.'),
    ].join(''),
  };
  const genericBody = (d) => P(`${esc(d.title)} lives in the ${esc(spaceOf(d.space).name)} Space. Open the case study's Sprint 4 review for a fuller Document.`) + `<p contenteditable="true"></p>`;

  const threads = [
    { id: 't1', doc: 'sprint-4-review', quote: 'the local stack is still blocked', resolved: false,
      comments: [{ who: 'ada', when: '1 hour ago', text: 'Is this still the storage container’s network? I can pair on it Monday.' }, { who: 'kd', when: '40 min ago', text: 'Same one. Monday works.' }] },
  ];
  const versions = {
    'sprint-4-review': [
      { id: 'v4', who: 'kd', when: 'Today, 14:32' },
      { id: 'v3', who: 'kd', when: 'Yesterday, 17:05', name: 'Shared with Mira' },
      { id: 'v2', who: 'mira', when: 'Yesterday, 16:40' },
      { id: 'v1', who: 'kd', when: '14 Oct, 10:12' },
    ],
    'architecture-overview': [
      { id: 'a3', who: 'ada', when: 'Yesterday, 11:20' },
      { id: 'a2', who: 'ada', when: '2 Oct, 09:00', name: 'Reviewed by the team' },
      { id: 'a1', who: 'ada', when: '19 Aug, 15:02' },
    ],
  };

  const tokens = [
    { id: 'tk1', name: 'Laptop CLI', scope: 'Every Project I can reach', created: '2 Oct', used: 'Today', expires: '31 Dec 2026' },
    { id: 'tk2', name: 'CI read access', scope: 'Dalqen only', created: '18 Sep', used: '3 days ago', expires: '18 Mar 2027' },
  ];

  // ----------------------------------------------------------------- state --

  const S = {
    path: '/',
    signedIn: EMBEDDED,
    theme: 'light',
    collapsed: false,
    pop: null,        // { kind, x, y, ... }
    dialog: null,     // { kind, ... }
    palette: null,    // { q, i }
    notif: false,
    saved: [],
    guardUntil: 0,
    side: null,       // 'history' | 'comments' on a Document
    viewVersion: null,
    kb: -1,           // keyboard row in the issue list
    attention: [
      { id: 'att-pat', icon: 'mail-off', title: 'Pat Pending’s invitation has expired', sub: 'Sent to pat@xkye.dev 5 days ago. Nobody can accept it until it is sent again.', acts: [['Send again', 'resend'], ['Cancel invitation', 'cancelInvite']] },
      { id: 'att-sam', icon: 'user-pause', title: 'Sam Suspended has been suspended for 64 days', sub: 'Past the 60-day review period. Restore them, remove them from Kova, or keep things as they are.', acts: [['Restore', 'restoreSam'], ['Remove from Kova', 'removeSam'], ['Keep as is', 'keepSam']] },
    ],
  };

  // --------------------------------------------------------------- helpers --

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const issueById = (id) => issues.find((i) => i.id === id);
  const projectOf = (key) => projects.find((p) => p.key === key);
  const spaceOf = (slug) => spaces.find((s) => s.slug === slug);
  const docById = (id) => docs.find((d) => d.id === id);
  const runningSprint = (key) => Object.values(sprints).find((s) => s.project === key && s.state === 'running');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (d) => { if (!d) return ''; const [, m, day] = d.split('-'); return `${+day} ${MONTHS[+m - 1]}`; };
  const isOverdue = (i) => i.due && i.due < TODAY && OPEN.includes(i.status);
  const firstName = (id) => people[id]?.name.split(' ')[0];

  const avatar = (id, cls = '') => id && people[id]
    ? `<span class="avatar ${cls}" style="background:${people[id].color}" title="${esc(people[id].name)}">${people[id].ini}</span>`
    : `<span class="avatar ${cls}" style="background:transparent;border:1px dashed var(--border-strong);color:var(--text-tertiary)" title="Unassigned"><i class="ti ti-user" style="font-size:11px"></i></span>`;
  const projIc = (key, size = 18) => { const p = projectOf(key); return `<span class="proj-ic" style="background:${p.color};width:${size}px;height:${size}px">${key[0]}</span>`; };
  const statusChip = (s) => `<span class="chip" style="background:var(--status-${s}-tint);color:var(--status-${s})"><i class="ti ti-${STATUS[s].icon}"></i>${STATUS[s].label}</span>`;
  const priChip = (p) => `<span class="chip" style="background:var(--priority-${p}-tint);color:var(--priority-${p})"><i class="ti ti-${PRIORITY[p].icon}"></i>${PRIORITY[p].label}</span>`;
  const projStatusChip = (s) => { const [tone, label] = PROJECT_STATUS[s]; return `<span class="chip" style="background:var(--status-${tone}-tint);color:var(--status-${tone})">${label}</span>`; };
  const labelChips = (ls) => ls.map((l) => `<span class="chip label">${esc(l)}</span>`).join(' ');
  const due = (i) => i.due ? `<span class="mono" style="color:${isOverdue(i) ? 'var(--danger)' : 'var(--text-tertiary)'}">${fmtDate(i.due)}</span>` : '';

  function toast(msg, icon = 'circle-check') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="ti ti-${icon}"></i><span>${msg}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function log(issue, text) {
    issue.log.push({ who: ME, text, when: 'Just now' });
    activity.unshift({ who: ME, icon: 'activity', text: `${text.replace(/^(\w+)/, '$1')} on <b>${issue.id}</b>`, project: issue.project, when: 'Just now' });
  }

  // ---------------------------------------------------------------- router --

  function parse(path) {
    const [p, qs] = path.split('?');
    const q = new URLSearchParams(qs || '');
    const seg = p.split('/').filter(Boolean).map(decodeURIComponent);
    if (!seg.length) return { n: 'home', q };
    switch (seg[0]) {
      case 'sign-in': return { n: 'signin', q };
      case 'my-work': return { n: 'mywork', q };
      case 'notifications': return { n: 'notifications', q };
      case 'plan': return { n: 'plan', q };
      case 'activity': return { n: 'activity', q };
      case 'search': return { n: 'search', q };
      case 'settings': return { n: 'tokens', q };
      case 'projects':
        if (!seg[1]) return { n: 'projects', q };
        if (!projectOf(seg[1].toUpperCase())) return { n: 'notfound', q };
        if (!seg[2]) return { n: 'project', key: seg[1].toUpperCase(), q };
        return { n: 'project-' + seg[2], key: seg[1].toUpperCase(), q };
      case 'issues':
        if (seg[1]) return issueById(seg[1].toUpperCase()) ? { n: 'issue', id: seg[1].toUpperCase(), q } : { n: 'notfound', q };
        return { n: 'issues', q };
      case 'docs':
        if (!seg[1]) return { n: 'docs', q };
        return { n: 'doc', space: seg[1], id: seg[2], q };
      case 'admin':
        return { n: seg[1] === 'members' ? 'members' : 'attention', q };
    }
    return { n: 'notfound', q };
  }
  const areaOf = (r) => (r.n === 'docs' || r.n === 'doc') ? 'docs' : (r.n === 'attention' || r.n === 'members') ? 'admin' : 'kova';
  const remembered = { kova: '/', docs: '/docs', admin: '/admin' };

  function nav(path, { keep = false } = {}) {
    if (!keep) { S.pop = null; S.notif = false; S.palette = null; S.dialog = null; }
    if (path !== S.path) { S.kb = -1; S.viewVersion = null; }
    S.path = path;
    const r = parse(path);
    remembered[areaOf(r)] = path;
    render();
    $('.main')?.scrollTo(0, 0);
    report();
  }

  function report() {
    if (EMBEDDED) parent.postMessage({ type: 'kova:url', path: S.path, theme: S.theme }, '*');
    // Standalone, the address bar carries the path, so any view (a narrowed list included) is a link.
    else if (S.signedIn && location.hash.slice(1) !== S.path) history.pushState(null, '', '#' + S.path);
  }
  window.addEventListener('hashchange', () => {
    const p = location.hash.slice(1);
    if (p.startsWith('/') && p !== S.path) { S.signedIn = true; nav(p); }
  });

  // ------------------------------------------------------------- filtering --

  const FIELDS = [
    { id: 'status', label: 'Status', values: Object.keys(STATUS), show: (v) => statusChip(v) },
    { id: 'priority', label: 'Priority', values: Object.keys(PRIORITY), show: (v) => priChip(v) },
    { id: 'assignee', label: 'Assignee', values: ['me', 'ada', 'mira', 'none'], show: (v) => v === 'me' ? `${avatar(ME, 'sm')} Me` : v === 'none' ? `${avatar(null, 'sm')} Unassigned` : `${avatar(v, 'sm')} ${esc(people[v].name)}` },
    { id: 'project', label: 'Project', values: projects.map((p) => p.key), show: (v) => `${projIc(v, 16)} ${esc(projectOf(v).name)}` },
    { id: 'placement', label: 'Placement', values: ['current', 'backlog'], show: (v) => v === 'current' ? '<i class="ti ti-player-play"></i> Running Sprint' : '<i class="ti ti-stack-2"></i> Backlog' },
  ];
  const short = (field, v) => field === 'assignee' ? (v === 'me' ? 'Me' : v === 'none' ? 'Unassigned' : firstName(v)) : field === 'status' ? STATUS[v].label : field === 'priority' ? PRIORITY[v].label : field === 'placement' ? (v === 'current' ? 'Running Sprint' : 'Backlog') : v;

  function filterOf(q) {
    const f = {};
    for (const fd of FIELDS) { const v = q.get(fd.id); if (v) f[fd.id] = v.split(',').filter((x) => fd.values.includes(x)); }
    return f;
  }
  function matches(i, f) {
    if (f.status?.length && !f.status.includes(i.status)) return false;
    if (f.priority?.length && !f.priority.includes(i.priority)) return false;
    if (f.project?.length && !f.project.includes(i.project)) return false;
    if (f.assignee?.length && !f.assignee.some((a) => a === 'me' ? i.assignee === ME : a === 'none' ? !i.assignee : i.assignee === a)) return false;
    if (f.placement?.length && !f.placement.some((p) => p === 'backlog' ? !i.sprint : sprints[i.sprint]?.state === 'running')) return false;
    return true;
  }
  function pathWith(base, f) {
    const qs = FIELDS.filter((fd) => f[fd.id]?.length).map((fd) => `${fd.id}=${f[fd.id].join(',')}`).join('&');
    return qs ? `${base}?${qs}` : base;
  }

  // ----------------------------------------------------------------- views --

  function render() {
    document.documentElement.dataset.theme = S.theme;
    const root = $('#root');
    const r = parse(S.path);
    if (!S.signedIn || r.n === 'signin') { root.innerHTML = signIn(); renderLayer(); return; }
    saveDocDraft();
    const area = areaOf(r);
    root.innerHTML = `<div class="app ${S.collapsed ? 'collapsed' : ''}">
      ${strip(area)}
      <nav class="panel" aria-label="${area === 'docs' ? 'Kova Docs' : area === 'admin' ? 'Admin' : 'Primary'}">${panel(area, r)}</nav>
      <main class="main" id="main-content" tabindex="-1">${view(r)}</main>
    </div>`;
    hydrate(r);
    renderLayer();
  }

  function signIn() {
    return `<div class="signin"><form class="card" data-form="signin">
      <img src="assets/brand/kova-horizontal-color.svg" alt="Kova" />
      <h1>Sign in to Kova</h1>
      <p class="muted" style="margin:0 0 6px">Accounts are created by an Owner’s invitation. There is no public sign-up.</p>
      <label class="f" for="em">Email</label><input class="input" id="em" type="email" value="developer@xkye.dev" autocomplete="username" />
      <label class="f" for="pw">Password</label><input class="input" id="pw" type="password" value="kova-local-only" autocomplete="current-password" />
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:18px;height:34px">Sign in</button>
      <p class="subtle" style="font-size:12px;margin:14px 0 0;text-align:center">Prototype: any password signs you in as Kova Developer, an Owner.</p>
    </form></div>`;
  }

  function strip(area) {
    const att = S.attention.length;
    return `<nav class="strip" aria-label="Areas">
      <button class="area-btn" data-act="area" data-area="kova" aria-current="${area === 'kova'}" title="Kova"><img src="assets/brand/kova-symbol-color.svg" alt="Kova" /></button>
      <button class="area-btn" data-act="area" data-area="docs" aria-current="${area === 'docs'}" title="Kova Docs"><img src="assets/brand/docs-symbol-color.svg" alt="Kova Docs" /></button>
      <button class="area-btn" data-act="area" data-area="admin" aria-current="${area === 'admin'}" title="Admin"><i class="ti ti-shield-half"></i>${att ? `<span class="count">${att}</span>` : ''}</button>
      <span class="grow"></span>
      <button class="area-btn" data-act="userMenu" title="Kova Developer">${avatar(ME)}</button>
    </nav>`;
  }

  function panelHead(name, search = 'palette') {
    const unread = notifications.filter((n) => !n.read).length;
    return `<div class="panel-head"><b>${name}</b>
      <button class="icon-btn" data-act="bell" aria-label="Notifications${unread ? `, ${unread} unread` : ''}"><i class="ti ti-bell"></i>${unread ? `<span class="dot">${unread}</span>` : ''}</button>
      <button class="icon-btn" data-act="${search}" aria-label="Search"><i class="ti ti-search"></i></button>
      <button class="icon-btn" data-act="collapse" aria-label="Collapse panel" title="Collapse (⌘B)"><i class="ti ti-layout-sidebar-left-collapse"></i></button>
    </div>`;
  }

  const navItem = (to, icon, label, cur, end = '') => `<button class="nav-item" data-go="${to}" ${cur ? 'aria-current="page"' : ''}><i class="ti ti-${icon}"></i><span>${label}</span>${end ? `<span class="end">${end}</span>` : ''}</button>`;

  function panel(area, r) {
    if (area === 'docs') return docsPanel(r);
    if (area === 'admin') {
      return panelHead('Admin') + `<div class="panel-body"><div class="nav-group"><h6>Installation</h6>
        ${navItem('/admin', 'inbox', 'Needs attention', r.n === 'attention', S.attention.length || '')}
        ${navItem('/admin/members', 'users', 'People', r.n === 'members', Object.values(people).filter((p) => p.status !== 'removed').length)}
        <button class="nav-item" data-act="soon" data-what="Audit log"><i class="ti ti-list-search"></i><span>Audit log</span></button>
        <button class="nav-item" data-act="soon" data-what="Planning Defaults"><i class="ti ti-adjustments"></i><span>Planning Defaults</span></button>
        <button class="nav-item" data-act="soon" data-what="Operations"><i class="ti ti-heart-rate-monitor"></i><span>Operations</span></button>
      </div></div>`;
    }
    const cur = r.n;
    const mine = issues.filter((i) => i.assignee === ME && OPEN.includes(i.status)).length;
    const unread = notifications.filter((n) => !n.read).length;
    return panelHead('Kova') + `<div class="panel-body">
      <div class="nav-group"><h6>Your work</h6>
        ${navItem('/', 'home', 'Home', cur === 'home')}
        ${navItem('/my-work', 'checklist', 'My Work', cur === 'mywork', mine)}
        ${navItem('/notifications', 'bell', 'Notifications', cur === 'notifications', unread || '')}
      </div>
      <div class="nav-group"><h6>Delivery</h6>
        ${navItem('/plan', 'calendar-week', 'Plan', cur === 'plan')}
        ${navItem('/projects', 'folders', 'Projects', cur === 'projects')}
        ${navItem('/issues', 'circle-dot', 'Issues', cur === 'issues' && !r.q.toString())}
      </div>
      ${S.saved.length ? `<div class="nav-group"><h6>Saved filters</h6>${S.saved.map((s) => navItem(s.path, 'filter', esc(s.name), S.path === s.path)).join('')}</div>` : ''}
      <div class="nav-group"><h6>Discover</h6>
        ${navItem('/activity', 'history', 'Activity', cur === 'activity')}
        ${navItem('/search', 'search', 'Search', cur === 'search')}
      </div>
      <div class="nav-group"><h6>Projects</h6>
        ${projects.filter((p) => p.status === 'active').map((p) => `<button class="nav-item" data-go="/projects/${p.key}" ${r.key === p.key ? 'aria-current="page"' : ''}>${projIc(p.key)}<span>${esc(p.name)}</span><span class="end mono">${p.key}</span></button>`).join('')}
      </div>
    </div>`;
  }

  function view(r) {
    switch (r.n) {
      case 'home': return home();
      case 'mywork': return myWork();
      case 'notifications': return notificationsPage();
      case 'plan': return planPortfolio();
      case 'projects': return projectsPage();
      case 'project': return projectOverview(r.key);
      case 'project-board': return boardPage(r.key);
      case 'project-plan': return projectPlan(r.key);
      case 'project-issues': return issuesPage(r, r.key);
      case 'project-docs': setTimeout(() => nav(`/docs?project=${r.key}`)); return '';
      case 'project-settings': return projectOverview(r.key);
      case 'issues': return issuesPage(r);
      case 'issue': return issuePage(r.id);
      case 'activity': return activityPage();
      case 'search': return searchPage(r.q.get('q') || '');
      case 'tokens': return tokensPage();
      case 'docs': return docsHome(r);
      case 'doc': return docPage(r);
      case 'attention': return attentionPage();
      case 'members': return membersPage();
    }
    return `<div class="page"><div class="empty" style="padding-top:120px"><i class="ti ti-map-question"></i><b style="color:var(--text-primary);font-size:15px">Nothing lives at this address.</b><p>It may have been removed, or the link was mistyped.</p><button class="btn" data-go="/">Go to Home</button></div></div>`;
  }

  function issueRow(i, extra = '') {
    return `<li class="row" data-go="/issues/${i.id}">
      ${priIcon(i.priority)}<span class="key" style="width:54px">${i.id}</span>
      <span class="title">${esc(i.title)}</span>${extra}
      ${labelChips(i.labels.slice(0, 2))} ${statusChip(i.status)} ${due(i)} ${avatar(i.assignee, 'sm')}
    </li>`;
  }
  const priIcon = (p) => `<i class="ti ti-${PRIORITY[p].icon}" style="color:var(--priority-${p});font-size:14px" title="${PRIORITY[p].label}"></i>`;

  function home() {
    const mine = issues.filter((i) => i.assignee === ME && OPEN.includes(i.status));
    const review = notifications.filter((n) => /for your review/.test(n.text)).length;
    const dueSoon = mine.filter((i) => i.due && i.due <= '2026-10-22').length;
    const blocked = issues.filter((i) => i.status === 'blocked').length;
    const recent = docs.filter((d) => d.recent).sort((a, b) => a.recent - b.recent).slice(0, 4);
    return `<div class="page">
      <div class="page-head"><div><h1>Home</h1><div class="muted">Friday 16 October. Here is what needs you.</div></div><span class="grow"></span>
        <button class="btn" data-act="palette"><i class="ti ti-search"></i> Search <span class="kbd">⌘K</span></button>
        <button class="btn primary" data-act="newIssue"><i class="ti ti-plus"></i> New issue</button></div>
      <div class="stats">
        <button class="card stat" data-go="/issues?assignee=me&status=todo,in_progress,in_review,blocked" style="text-align:left"><div class="n">${mine.length}</div><div class="l">Assigned to you, open</div></button>
        <button class="card stat" data-go="/issues/DAL-4" style="text-align:left"><div class="n">${review}</div><div class="l">Waiting on your review</div></button>
        <button class="card stat" data-go="/my-work" style="text-align:left"><div class="n">${dueSoon}</div><div class="l">Yours due in the next week</div></button>
        <button class="card stat hot" data-go="/issues?status=blocked" style="text-align:left"><div class="n">${blocked}</div><div class="l">Blocked across Projects</div></button>
      </div>
      <div class="grid2">
        <div class="stack">
          <section class="card"><div class="card-h"><i class="ti ti-checklist"></i>Assigned to you<span class="end"><a class="subtle" href="#" data-go="/my-work">My Work</a></span></div><ul class="rows">${mine.map((i) => issueRow(i)).join('')}</ul></section>
          <section class="card"><div class="card-h"><i class="ti ti-player-play"></i>Running Sprints</div>${['DAL', 'REN', 'INT'].map(sprintSummary).join('')}</section>
        </div>
        <div class="stack">
          <section class="card"><div class="card-h"><i class="ti ti-history"></i>Lately in your Projects</div><div style="padding:4px 14px">${feed(activity.slice(0, 6))}</div></section>
          <section class="card"><div class="card-h"><img src="assets/brand/docs-symbol-color.svg" alt="" style="width:15px" />Recent documents</div><ul class="rows">${recent.map((d) => `<li class="row" data-go="/docs/${d.space}/${d.id}"><span>${d.icon}</span><span class="title">${esc(d.title)}</span>${d.draft ? '<span class="chip draft">Draft</span>' : ''}<span class="subtle" style="font-size:12px">${d.edited}</span></li>`).join('')}</ul></section>
        </div>
      </div>
    </div>`;
  }

  function sprintSummary(key) {
    const sp = runningSprint(key); if (!sp) return '';
    const its = issues.filter((i) => i.sprint === sp.id);
    const done = its.filter((i) => i.status === 'done').length;
    const prog = its.filter((i) => ['in_progress', 'in_review'].includes(i.status)).length;
    return `<div class="row" data-go="/projects/${key}/plan" style="min-height:52px">${projIc(key)}<div style="flex:1"><div style="display:flex;gap:8px;align-items:baseline"><b style="font-weight:500">${esc(projectOf(key).name)} · ${sp.name}</b><span class="subtle" style="font-size:12px">${sp.range}</span><span class="grow"></span><span class="subtle mono" style="margin-left:auto">${done} of ${its.length} done</span></div>
      <div class="meter" style="margin-top:6px"><i style="width:${(done / its.length) * 100}%"></i><i class="p" style="width:${(prog / its.length) * 100}%;opacity:.55"></i></div></div></div>`;
  }

  function feed(items) {
    if (!items.length) return '<div class="empty">Nothing has happened here yet.</div>';
    return `<ul class="feed">${items.map((a) => `<li><span class="ev-ic"><i class="ti ti-${a.icon || 'activity'}"></i></span><span style="flex:1"><b>${esc(people[a.who]?.name || 'Kova')}</b> ${a.text}</span><span class="subtle" style="white-space:nowrap;font-size:11.5px">${a.when}</span></li>`).join('')}</ul>`;
  }

  function myWork() {
    const mine = issues.filter((i) => i.assignee === ME && OPEN.includes(i.status));
    const sprintIds = Object.values(sprints).filter((s) => s.state === 'running').map((s) => s.id);
    const q1 = mine.filter((i) => sprintIds.includes(i.sprint));
    const q2 = issues.filter((i) => i.status === 'in_review' && notifications.some((n) => n.go === `/issues/${i.id}` && /review/.test(n.text)));
    const q3 = mine.filter((i) => !sprintIds.includes(i.sprint));
    const sec = (title, list, empty) => `<section class="card"><div class="card-h">${title} <span class="subtle mono">(${list.length})</span></div>${list.length ? `<ul class="rows">${list.map((i) => issueRow(i)).join('')}</ul>` : `<div class="empty">${empty}</div>`}</section>`;
    return `<div class="page"><div class="page-head"><h1>My Work</h1></div><div class="stack" style="max-width:900px">
      ${sec('In a running Sprint', q1, 'Nothing of yours is in a running Sprint.')}
      ${sec('Sent for your review', q2, 'Nobody is waiting on your review.')}
      ${sec('Everything else assigned to you', q3, 'That’s everything.')}
    </div></div>`;
  }

  function notificationsPage() {
    return `<div class="page"><div class="page-head"><h1>Notifications</h1><span class="grow"></span><button class="btn" data-act="readAll"><i class="ti ti-checks"></i> Mark all read</button></div>
      <section class="card" style="max-width:760px;padding:6px">${notifications.map(notifRow).join('')}</section>
      <p class="subtle" style="max-width:760px;font-size:12px">A Notification says something that concerns you happened. It is never about your own act, and something waiting on an Owner lives in Admin’s Needs attention instead.</p></div>`;
  }
  const notifRow = (n) => `<div class="notif" data-act="openNotif" data-id="${n.id}">${n.read ? '<span style="width:7px"></span>' : '<span class="unread"></span>'}${avatar(n.who, 'sm')}<div class="bd"><b>${esc(people[n.who].name)}</b> ${n.text}<div class="subtle" style="font-size:11.5px">${n.when}</div></div>${n.read ? '' : `<button class="read-btn" data-act="markRead" data-id="${n.id}">Mark read</button>`}</div>`;

  function projectsPage() {
    return `<div class="page"><div class="page-head"><h1>Projects</h1><span class="grow"></span><button class="btn" data-act="soon" data-what="Creating a Project"><i class="ti ti-plus"></i> New Project</button></div>
      <section class="card"><table class="t"><thead><tr><th></th><th>Name</th><th>Key</th><th>Status</th><th>Progress</th><th>Members</th></tr></thead><tbody>
      ${projects.map((p) => { const its = issues.filter((i) => i.project === p.key); const d = its.filter((i) => i.status === 'done').length; return `<tr data-go="/projects/${p.key}"><td style="width:30px">${projIc(p.key, 20)}</td><td class="ttl">${esc(p.name)}<div class="subtle" style="font-weight:400;font-size:12px">${esc(p.summary)}</div></td><td class="key">${p.key}</td><td>${projStatusChip(p.status)}</td><td class="mono subtle">${its.length ? `${d} of ${its.length} issues done` : 'No issues yet'}</td><td>${p.members.map((m) => avatar(m, 'sm')).join('')}</td></tr>`; }).join('')}
      </tbody></table></section></div>`;
  }

  function projectTabs(key, cur) {
    const t = (id, label, to) => `<button class="nav-item" style="width:auto;height:32px;border-radius:0;border-bottom:2px solid ${cur === id ? 'var(--accent)' : 'transparent'};color:${cur === id ? 'var(--text-primary)' : ''};background:none" data-go="${to}" ${cur === id ? 'aria-current="page"' : ''}>${label}</button>`;
    return `<div style="display:flex;gap:4px;border-bottom:1px solid var(--border-subtle);margin:0 0 18px">
      ${t('overview', 'Overview', `/projects/${key}`)}${t('issues', 'Issues', `/projects/${key}/issues`)}${t('board', 'Board', `/projects/${key}/board`)}${t('plan', 'Plan', `/projects/${key}/plan`)}${t('docs', 'Docs <i class="ti ti-arrow-up-right" style="font-size:12px"></i>', `/docs?project=${key}`)}${t('settings', 'Settings', `/projects/${key}`)}
    </div>`;
  }
  function projectHeader(key) {
    const p = projectOf(key);
    return `<div class="crumbs"><a href="#" data-go="/projects">Projects</a><i class="ti ti-chevron-right" style="font-size:12px"></i><span>${esc(p.name)}</span></div>
      <div class="page-head" style="margin-bottom:12px">${projIc(key, 30)}<h1>${esc(p.name)}</h1><span class="key" style="font-size:13px">${key}</span>${projStatusChip(p.status)}<span class="grow"></span><button class="btn primary" data-act="newIssue" data-project="${key}"><i class="ti ti-plus"></i> New issue</button></div>`;
  }

  function projectOverview(key) {
    const p = projectOf(key);
    const its = issues.filter((i) => i.project === key);
    const d = its.filter((i) => i.status === 'done').length;
    const sp = runningSprint(key);
    return `<div class="page">${projectHeader(key)}${projectTabs(key, 'overview')}
      <div class="grid2"><div class="stack">
        <section class="card" style="padding:16px"><p style="margin:0 0 14px;font-size:14px">${esc(p.desc)}</p>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><b style="font-weight:500">${d} of ${its.length} issues done</b><span class="subtle">Counted from the issues themselves, never stored</span></div>
          <div class="meter"><i style="width:${its.length ? (d / its.length) * 100 : 0}%"></i></div></section>
        <section class="card"><div class="card-h">Open issues<span class="end"><a class="subtle" href="#" data-go="/projects/${key}/issues?status=todo,in_progress,in_review,blocked">See all</a></span></div><ul class="rows">${its.filter((i) => OPEN.includes(i.status)).slice(0, 6).map((i) => issueRow(i)).join('') || '<div class="empty">No open issues.</div>'}</ul></section>
      </div><div class="stack">
        <section class="card" style="padding:14px 16px"><dl class="props">
          <dt>Status</dt><dd>${projStatusChip(p.status)}</dd>
          <dt>Members</dt><dd>${p.members.map((m) => avatar(m, 'sm')).join(' ')}</dd>
          <dt>Sprint</dt><dd>${sp ? `${sp.name} · <span class="subtle">${sp.range}</span>` : '<span class="subtle">None running</span>'}</dd>
          <dt>Labels</dt><dd>${labelChips([...new Set(its.flatMap((i) => i.labels))])}</dd>
        </dl></section>
        <section class="card"><div class="card-h">Activity</div><div style="padding:4px 14px">${feed(activity.filter((a) => a.project === key).slice(0, 5))}</div></section>
      </div></div></div>`;
  }

  function issuesPage(r, fixedProject) {
    const f = filterOf(r.q);
    if (fixedProject) f.project = [fixedProject];
    const list = issues.filter((i) => matches(i, f));
    const base = fixedProject ? `/projects/${fixedProject}/issues` : '/issues';
    const active = FIELDS.some((fd) => !(fixedProject && fd.id === 'project') && f[fd.id]?.length);
    const fbtn = (fd) => {
      if (fixedProject && fd.id === 'project') return '';
      const vals = f[fd.id] || [];
      return `<button class="fbtn ${vals.length ? 'on' : ''}" data-act="filter" data-field="${fd.id}" aria-haspopup="true">${vals.length ? `${fd.label} <b>${vals.length > 2 ? `${vals.length} values` : vals.map((v) => short(fd.id, v)).join(', ')}</b>` : `<i class="ti ti-plus" style="font-size:13px"></i>${fd.label}`}</button>`;
    };
    return `<div class="page wide">${fixedProject ? projectHeader(fixedProject) + projectTabs(fixedProject, 'issues') : `<div class="page-head"><h1>Issues</h1><span class="subtle mono">${list.length}</span><span class="grow"></span><button class="btn primary" data-act="newIssue"><i class="ti ti-plus"></i> New issue</button></div>`}
      <div class="filters">${FIELDS.map(fbtn).join('')}
        ${active ? `<button class="btn ghost sm" data-go="${base}">Clear</button><button class="btn sm" data-act="saveFilter"><i class="ti ti-bookmark"></i> Save filter</button><button class="btn ghost sm" data-act="copyLink"><i class="ti ti-link"></i> Copy link</button>` : ''}
        <span class="grow" style="flex:1"></span><span class="subtle" style="font-size:12px"><span class="kbd">j</span> <span class="kbd">k</span> to move, <span class="kbd">↵</span> to open</span>
      </div>
      <section class="card">${list.length ? `<table class="t" id="issue-table"><thead><tr><th></th><th>Key</th><th>Title</th><th>Status</th><th>Labels</th><th>Due</th><th>Assignee</th></tr></thead><tbody>
        ${list.map((i, n) => `<tr data-go="/issues/${i.id}" data-row="${n}" class="${S.kb === n ? 'kb' : ''}" ${S.kb === n ? 'style="outline:2px solid var(--accent);outline-offset:-2px"' : ''}><td style="width:24px">${priIcon(i.priority)}</td><td class="key">${i.id}</td><td class="ttl">${esc(i.title)}</td><td>${statusChip(i.status)}</td><td>${labelChips(i.labels)}</td><td>${due(i)}</td><td>${avatar(i.assignee, 'sm')}</td></tr>`).join('')}
      </tbody></table>` : `<div class="empty"><i class="ti ti-filter-off"></i>No issues match this Filter.<div style="margin-top:10px"><button class="btn sm" data-go="${base}">Clear the Filter</button></div></div>`}</section></div>`;
  }

  function issuePage(id) {
    const i = issueById(id);
    const p = projectOf(i.project);
    const sp = sprints[i.sprint];
    const timeline = [...i.log.map((l) => ({ ...l, kind: 'log' })), ...i.comments.map((c) => ({ ...c, kind: 'comment' }))];
    return `<div class="page wide" style="max-width:1100px">
      <div class="crumbs">${projIc(i.project, 16)}<a href="#" data-go="/projects/${p.key}">${esc(p.name)}</a><i class="ti ti-chevron-right" style="font-size:12px"></i><a href="#" data-go="/projects/${p.key}/issues">Issues</a><i class="ti ti-chevron-right" style="font-size:12px"></i><span class="mono">${i.id}</span></div>
      <div class="issue"><div>
        <h1>${esc(i.title)}</h1>
        <div class="md">${i.desc || '<p class="subtle">No description yet.</p>'}</div>
        <h3 style="font-size:13px;margin:26px 0 4px">Activity</h3>
        <ul class="feed">${timeline.map((t) => t.kind === 'log'
          ? `<li><span class="ev-ic"><i class="ti ti-point"></i></span><span style="flex:1"><b>${esc(people[t.who].name)}</b> ${esc(t.text)}</span><span class="subtle" style="font-size:11.5px">${t.when}</span></li>`
          : `<li style="display:block"><div class="comment"><div class="who">${avatar(t.who, 'sm')}<b>${esc(people[t.who].name)}</b><span class="subtle">${t.when}</span></div><p>${esc(t.text)}</p></div></li>`).join('')}</ul>
        <form class="composer" data-form="comment" data-id="${i.id}"><textarea id="comment-box" placeholder="Leave a comment. Mention someone with @." aria-label="Comment"></textarea>
          <div class="bar"><span class="subtle" style="font-size:11.5px">Markdown is supported</span><button class="btn primary sm">Comment</button></div></form>
      </div>
      <aside><section class="card" style="padding:14px 16px;position:sticky;top:16px"><dl class="props">
        <dt>Status</dt><dd><button class="prop-btn" data-act="prop" data-prop="status" data-id="${i.id}">${statusChip(i.status)}</button></dd>
        <dt>Priority</dt><dd><button class="prop-btn" data-act="prop" data-prop="priority" data-id="${i.id}">${priChip(i.priority)}</button></dd>
        <dt>Assignee</dt><dd><button class="prop-btn" data-act="prop" data-prop="assignee" data-id="${i.id}">${avatar(i.assignee, 'sm')} ${i.assignee ? esc(people[i.assignee].name) : '<span class="subtle">Unassigned</span>'}</button></dd>
        <dt>Placement</dt><dd><span class="prop-btn">${sp ? `<i class="ti ti-player-play" style="font-size:13px"></i> ${sp.name}` : '<i class="ti ti-stack-2" style="font-size:13px"></i> Backlog'}</span></dd>
        <dt>Estimate</dt><dd><span class="prop-btn">${i.est != null ? `<span class="est">${i.est}</span>` : '<span class="subtle">None</span>'}</span></dd>
        <dt>Due</dt><dd><span class="prop-btn">${i.due ? due(i) : '<span class="subtle">None</span>'}</span></dd>
        <dt>Labels</dt><dd><span class="prop-btn" style="flex-wrap:wrap">${labelChips(i.labels) || '<span class="subtle">None</span>'}</span></dd>
      </dl><hr style="border:0;border-top:1px solid var(--border-subtle);margin:12px 0" />
      <div style="display:flex;gap:6px"><button class="btn sm" data-act="copyLink"><i class="ti ti-link"></i> Copy link</button><button class="btn sm ghost" data-act="cliHint" data-id="${i.id}"><i class="ti ti-terminal-2"></i> In the CLI</button></div>
      </section></aside></div></div>`;
  }

  const BOARD_COLS = ['todo', 'in_progress', 'in_review', 'blocked', 'done'];
  function boardPage(key) {
    const its = issues.filter((i) => i.project === key && i.status !== 'cancelled');
    return `<div class="page wide">${projectHeader(key)}${projectTabs(key, 'board')}
      <div class="board">${BOARD_COLS.map((s) => {
        const col = its.filter((i) => i.status === s);
        return `<div class="col" data-col="${s}"><div class="col-h"><i class="ti ti-${STATUS[s].icon}" style="color:var(--status-${s})"></i>${STATUS[s].label}<span class="n mono">${col.length}</span></div>
          ${col.map((i) => `<div class="bcard" draggable="true" data-card="${i.id}" data-go="/issues/${i.id}" tabindex="0"><div class="m"><span class="key">${i.id}</span><span class="grow"></span>${priIcon(i.priority)}</div><div class="t">${esc(i.title)}</div><div class="m">${labelChips(i.labels.slice(0, 2))}<span class="grow"></span>${i.est != null ? `<span class="est">${i.est}</span>` : ''}${avatar(i.assignee, 'sm')}</div></div>`).join('')}
        </div>`;
      }).join('')}</div>
      <p class="subtle" style="font-size:12px;margin-top:10px">Drag a card to change its status. Cancelled issues are kept off the board and stay in the list.</p></div>`;
  }

  function points(list) { return list.reduce((n, i) => n + (i.est || 0), 0); }
  function projectPlan(key) {
    const sp = runningSprint(key);
    const next = Object.values(sprints).find((s) => s.project === key && s.state === 'planned');
    const inSp = sp ? issues.filter((i) => i.sprint === sp.id) : [];
    const inNext = next ? issues.filter((i) => i.sprint === next.id) : [];
    const backlog = issues.filter((i) => i.project === key && !i.sprint && OPEN.includes(i.status));
    const done = points(inSp.filter((i) => i.status === 'done'));
    const total = points(inSp);
    const planRow = (i, act) => `<li class="row" data-go="/issues/${i.id}">${priIcon(i.priority)}<span class="key" style="width:54px">${i.id}</span><span class="title">${esc(i.title)}</span>${statusChip(i.status)}${avatar(i.assignee, 'sm')}<span class="est">${i.est ?? '–'}</span>${act}</li>`;
    return `<div class="page wide" style="max-width:1100px">${projectHeader(key)}${projectTabs(key, 'plan')}
      ${sp ? `<section class="card" style="margin-bottom:16px"><div class="card-h"><i class="ti ti-player-play" style="color:var(--accent)"></i>${sp.name}<span class="subtle" style="font-weight:400">${sp.range} · running</span><span class="end mono subtle">${done} of ${total} points done</span></div>
        <div style="padding:10px 14px 4px"><div class="meter"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div></div>
        <ul class="rows">${inSp.map((i) => planRow(i, `<button class="icon-btn" data-act="toBacklog" data-id="${i.id}" title="Move to the Backlog"><i class="ti ti-arrow-bar-to-down"></i></button>`)).join('')}</ul></section>` : ''}
      ${next ? `<section class="card" style="margin-bottom:16px"><div class="card-h"><i class="ti ti-calendar"></i>${next.name}<span class="subtle" style="font-weight:400">${next.range} · planned</span><span class="end mono subtle">${points(inNext)} points</span></div>
        ${inNext.length ? `<ul class="rows">${inNext.map((i) => planRow(i, `<button class="icon-btn" data-act="toBacklog" data-id="${i.id}" title="Move to the Backlog"><i class="ti ti-arrow-bar-to-down"></i></button>`)).join('')}</ul>` : '<div class="empty" style="padding:18px">Nothing planned yet. Move issues up from the Backlog.</div>'}</section>` : ''}
      <section class="card"><div class="card-h"><i class="ti ti-stack-2"></i>Backlog<span class="end mono subtle">${backlog.length} issues · ${points(backlog)} points</span></div>
        ${backlog.length ? `<ul class="rows">${backlog.map((i) => planRow(i, `${sp ? `<button class="btn sm" data-act="toSprint" data-id="${i.id}" data-sprint="${sp.id}">${sp.name}</button>` : ''}${next ? `<button class="btn sm ghost" data-act="toSprint" data-id="${i.id}" data-sprint="${next.id}">${next.name}</button>` : ''}`)).join('')}</ul>` : '<div class="empty">The Backlog is empty.</div>'}</section>
      <p class="subtle" style="font-size:12px">Estimates use this Project’s scale (1, 2, 3, 5, 8), copied from the Planning Defaults when the Project was created.</p></div>`;
  }

  function planPortfolio() {
    return `<div class="page"><div class="page-head"><h1>Plan</h1><span class="muted">Every Project you can read, one card each.</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px">${projects.filter((p) => ['active', 'planned'].includes(p.status)).map((p) => {
        const sp = runningSprint(p.key); const its = sp ? issues.filter((i) => i.sprint === sp.id) : []; const d = points(its.filter((i) => i.status === 'done')); const t = points(its);
        const bl = issues.filter((i) => i.project === p.key && !i.sprint && OPEN.includes(i.status)).length;
        return `<section class="card" style="padding:14px 16px"><div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">${projIc(p.key, 22)}<b style="font-weight:600">${esc(p.name)}</b>${projStatusChip(p.status)}</div>
          ${sp ? `<div style="font-size:12.5px;display:flex;justify-content:space-between"><span>${sp.name} · <span class="subtle">${sp.range}</span></span><span class="mono subtle">${d}/${t} pts</span></div><div class="meter" style="margin:6px 0 12px"><i style="width:${t ? (d / t) * 100 : 0}%"></i></div>` : '<p class="subtle" style="font-size:12.5px;margin:0 0 12px">No Sprint running.</p>'}
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="subtle" style="font-size:12px">${bl} in the Backlog</span><button class="btn sm" data-go="/projects/${p.key}/plan">Open plan</button></div></section>`;
      }).join('')}</div></div>`;
  }

  function activityPage() {
    return `<div class="page"><div class="page-head"><h1>Activity</h1><span class="muted">Across every Project you can read</span></div><section class="card" style="max-width:820px;padding:4px 16px">${feed(activity)}</section></div>`;
  }

  function searchAll(q) {
    const t = q.trim().toLowerCase();
    if (!t) return { is: [], ds: [] };
    return {
      is: issues.filter((i) => (i.id + ' ' + i.title).toLowerCase().includes(t)).slice(0, 8),
      ds: docs.filter((d) => !d.trashed && d.title.toLowerCase().includes(t)).slice(0, 6),
    };
  }
  function searchPage(q) {
    const { is, ds } = searchAll(q);
    return `<div class="page"><div class="page-head"><h1>Search</h1></div>
      <div class="home-search" style="margin-bottom:16px"><i class="ti ti-search"></i><input class="input" id="search-page" value="${esc(q)}" placeholder="Search issues and documents" aria-label="Search" /></div>
      <div id="search-results">${searchResults(q, is, ds)}</div></div>`;
  }
  const searchResults = (q, is, ds) => !q.trim() ? '<p class="subtle">Try “search”, “sprint” or an issue key like DAL-5.</p>'
    : `<section class="card" style="max-width:820px;margin-bottom:12px"><div class="card-h">Issues <span class="subtle mono">${is.length}</span></div>${is.length ? `<ul class="rows">${is.map((i) => issueRow(i)).join('')}</ul>` : '<div class="empty">No issues match.</div>'}</section>
       <section class="card" style="max-width:820px"><div class="card-h">Documents <span class="subtle mono">${ds.length}</span></div>${ds.length ? `<ul class="rows">${ds.map((d) => `<li class="row" data-go="/docs/${d.space}/${d.id}"><span>${d.icon}</span><span class="title">${esc(d.title)}</span><span class="subtle">${esc(spaceOf(d.space).name)}</span></li>`).join('')}</ul>` : '<div class="empty">No documents match.</div>'}</section>`;

  function tokensPage() {
    return `<div class="page"><div class="page-head"><div><h1>Personal access tokens</h1><div class="muted">For the CLI and scripts. A token is shown once, when it is created.</div></div><span class="grow"></span><button class="btn primary" data-act="newToken"><i class="ti ti-plus"></i> Create token</button></div>
      <section class="card" style="max-width:900px"><table class="t"><thead><tr><th>Name</th><th>Reaches</th><th>Created</th><th>Last used</th><th>Expires</th><th></th></tr></thead><tbody>
      ${tokens.map((t) => `<tr style="cursor:default"><td class="ttl">${esc(t.name)}</td><td class="subtle">${esc(t.scope)}</td><td class="mono subtle">${t.created}</td><td class="mono subtle">${t.used}</td><td class="mono subtle">${t.expires}</td><td><button class="btn sm" data-act="revokeToken" data-id="${t.id}">Revoke</button></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">No tokens. Create one to sign in from the CLI.</div></td></tr>'}
      </tbody></table></section>
      <div class="notice" style="max-width:900px;margin-top:12px"><i class="ti ti-terminal-2"></i><span>In a terminal, <code class="mono">kova auth login</code> asks for a token with a masked prompt, checks it against the server, and only then stores it in the system keychain. A token is never accepted as a command-line argument.</span></div></div>`;
  }

  // ---- Admin ----
  function attentionPage() {
    return `<div class="page"><div class="page-head"><div><h1>Needs attention</h1><div class="muted">Things waiting on an Owner. Each leaves the queue when it is dealt with.</div></div></div>
      <section class="card" style="max-width:860px">${S.attention.length ? S.attention.map((a) => `<div class="attn"><span class="ic"><i class="ti ti-${a.icon}"></i></span><div class="bd"><b>${a.title}</b><span>${a.sub}</span></div><div style="display:flex;gap:6px">${a.acts.map(([l, act], n) => `<button class="btn sm ${n === 0 ? '' : 'ghost'}" data-act="${act}">${l}</button>`).join('')}</div></div>`).join('')
        : '<div class="empty"><i class="ti ti-mood-check"></i>Nothing is waiting on you. The next review will add anything new here.</div>'}</section></div>`;
  }

  function membersPage() {
    const guarded = S.guardUntil > Date.now();
    const rows = Object.entries(people).filter(([, p]) => p.status !== 'removed');
    const chip = (p) => p.status === 'active' ? statusChip('done').replace('Done', 'Active').replace('circle-check', 'circle-filled')
      : p.status === 'invited' ? `<span class="chip" style="background:var(--priority-high-tint);color:var(--priority-high)"><i class="ti ti-mail"></i>${p.expired ? 'Invitation expired' : 'Invited'}</span>`
      : `<span class="chip" style="background:var(--status-blocked-tint);color:var(--status-blocked)"><i class="ti ti-player-pause"></i>Suspended</span>`;
    return `<div class="page wide" style="max-width:1100px"><div class="page-head"><div><h1>People</h1><div class="muted">Everyone who has a relationship with Xkye’s Kova installation.</div></div><span class="grow"></span>
        ${guarded ? `<span class="guard" title="Guarded acts are let through in this browser"><i class="ti ti-shield-check"></i>Confirmed · <span id="guard-left">5:00</span></span>` : ''}
        <button class="btn primary" data-act="invite"><i class="ti ti-user-plus"></i> Invite</button></div>
      <section class="card"><table class="t"><thead><tr><th>Person</th><th>Status</th><th>Role</th><th>Last active</th><th>Open issues</th><th></th></tr></thead><tbody>
      ${rows.map(([id, p]) => `<tr style="cursor:default"><td class="ttl"><div style="display:flex;gap:10px;align-items:center">${avatar(id)}<div>${esc(p.name)}${id === ME ? ' <span class="subtle">(you)</span>' : ''}<div class="subtle" style="font-weight:400;font-size:12px">${esc(p.email)}</div></div></div></td>
        <td>${chip(p)}</td><td>${p.owner ? '<span class="chip label"><i class="ti ti-crown"></i>Owner</span>' : '<span class="subtle">Member</span>'}</td>
        <td class="mono subtle">${p.last}</td><td class="mono subtle">${issues.filter((i) => i.assignee === id && OPEN.includes(i.status)).length}</td>
        <td style="text-align:right">${id === ME ? '' : `<button class="icon-btn" data-act="memberMenu" data-id="${id}" aria-label="Actions for ${esc(p.name)}"><i class="ti ti-dots"></i></button>`}</td></tr>`).join('')}
      </tbody></table></section>
      <p class="subtle" style="font-size:12px">Making someone an Owner, demoting or suspending an Owner, and removing someone from Kova each ask for a Confirmation code first.</p></div>`;
  }

  // ---- Kova Docs ----
  function docsPanel(r) {
    const cur = r.n === 'doc' ? r.id : null;
    const starred = docs.filter((d) => d.star && !d.trashed);
    const visible = (d) => !d.trashed && (!d.draft || d.author === ME || d.collaborators?.includes(ME));
    const tree = (space, parent, depth) => docs.filter((d) => d.space === space && d.parent === parent && visible(d)).map((d) => {
      const kids = docs.some((k) => k.parent === d.id && visible(k));
      return `<button class="tree-item" data-go="/docs/${d.space}/${d.id}" data-tree="${d.id}" ${cur === d.id ? 'aria-current="page"' : ''} style="padding-left:${6 + depth * 14}px"><span class="tw">${kids ? '<i class="ti ti-chevron-down"></i>' : ''}</span><span class="ico">${d.icon}</span><span class="lbl">${esc(d.title)}</span>${d.draft ? '<span class="chip draft" style="height:17px;font-size:10.5px">Draft</span>' : ''}</button>${kids ? tree(space, d.id, depth + 1) : ''}`;
    }).join('');
    return panelHead('Kova Docs', 'docSearch') + `<div class="panel-body">
      <button class="btn" style="width:100%;justify-content:center;margin:2px 0 6px" data-act="newDoc"><i class="ti ti-file-plus"></i> New document</button>
      ${navItem('/docs', 'home', 'Docs home', r.n === 'docs')}
      <div class="nav-group"><h6>Starred</h6>${starred.map((d) => `<button class="tree-item" data-go="/docs/${d.space}/${d.id}"><span class="tw"></span><span class="ico">${d.icon}</span><span class="lbl">${esc(d.title)}</span></button>`).join('') || '<div class="subtle" style="padding:2px 8px;font-size:12px">Star a Document to keep it here.</div>'}</div>
      ${spaces.map((s) => `<div class="nav-group"><h6 style="display:flex;align-items:center;gap:6px">${projIc(s.project, 14)} ${esc(s.name)}</h6>${tree(s.slug, null, 0)}</div>`).join('')}
      <div class="nav-group">${navItem('/docs?view=trash', 'trash', 'Trash', false, docs.filter((d) => d.trashed).length || '')}</div>
    </div>`;
  }

  const coverCss = (c) => c ? (c.startsWith('#') ? `background:${c}` : `background:${c}`) : 'background:var(--surface-sunken)';

  function docsHome(r) {
    const proj = r.q.get('project');
    const pool = docs.filter((d) => !d.trashed && (!d.draft || d.author === ME) && (!proj || spaceOf(d.space).project === proj));
    const recent = [...pool].sort((a, b) => (a.recent || 99) - (b.recent || 99)).slice(0, 8);
    return `<div class="page"><div class="page-head"><div><h1>${proj ? `${esc(projectOf(proj).name)} docs` : 'Docs home'}</h1><div class="muted">${proj ? 'This Project’s Spaces, inside Kova Docs.' : 'Every Document you can read, across all your Projects.'}</div></div></div>
      <div style="display:flex;gap:8px;margin-bottom:22px"><div class="home-search" style="flex:1"><i class="ti ti-search"></i><input class="input" id="doc-filter" placeholder="Search documents" aria-label="Search documents" /></div>
        <button class="btn primary" data-act="newDoc" style="height:38px"><i class="ti ti-file-plus"></i> New document</button><button class="btn" style="height:38px" data-act="soon" data-what="Starting from a Template"><i class="ti ti-template"></i> From a Template</button></div>
      <h3 style="font-size:13px;margin:0 0 10px">Recent</h3>
      <div class="doc-tiles" id="doc-tiles">${recent.map(docTile).join('')}</div>
      <h3 style="font-size:13px;margin:26px 0 10px">Changed lately in your Projects</h3>
      <section class="card" style="max-width:820px"><ul class="rows">
        <li class="row" data-go="/docs/REN/renigo-data-platform">${avatar('mira', 'sm')}<span class="title"><b style="font-weight:500">Mira Member</b> edited 📦 Renigo data platform</span><span class="subtle" style="font-size:12px">Yesterday</span></li>
        <li class="row" data-go="/docs/DAL/architecture-overview">${avatar('ada', 'sm')}<span class="title"><b style="font-weight:500">Ada Admin</b> named a version of 🏛️ Architecture overview, “Reviewed by the team”</span><span class="subtle" style="font-size:12px">2 Oct</span></li>
        <li class="row" data-go="/docs/xkye-handbook/onboarding-checklist">${avatar('ada', 'sm')}<span class="title"><b style="font-weight:500">Ada Admin</b> published ✅ Onboarding checklist</span><span class="subtle" style="font-size:12px">30 Sep</span></li>
      </ul></section></div>`;
  }
  const docTile = (d) => `<button class="doc-tile" data-go="/docs/${d.space}/${d.id}" data-title="${esc(d.title.toLowerCase())}"><div class="cv" style="${coverCss(d.cover)}"></div><div class="bd"><span class="ic">${d.icon}</span><b>${esc(d.title)}</b><span class="subtle" style="font-size:11.5px">${d.draft ? '<span class="chip draft" style="height:16px;font-size:10px">Draft</span> ' : ''}${esc(spaceOf(d.space).name)} · ${d.edited}</span></div></button>`;

  function docPage(r) {
    const d = docById(r.id);
    if (!d || d.trashed) return view({ n: 'notfound' });
    d.recent = 0.5; docs.forEach((x) => { if (x !== d && x.recent) x.recent += 0.01; });
    const sp = spaceOf(d.space);
    const parentDoc = d.parent && docById(d.parent);
    const openThreads = threads.filter((t) => t.doc === d.id && !t.resolved).length;
    if (d.html == null) d.html = (DOC_BODY[d.id] || (() => genericBody(d)))();
    const v = S.viewVersion && (versions[d.id] || []).find((x) => x.id === S.viewVersion);
    return `<div class="doc-top">
        <div class="crumbs">${projIc(sp.project, 16)}<span>${esc(sp.name)}</span>${parentDoc ? `<i class="ti ti-chevron-right" style="font-size:12px"></i><a href="#" data-go="/docs/${d.space}/${parentDoc.id}">${parentDoc.icon} ${esc(parentDoc.title)}</a>` : ''}<i class="ti ti-chevron-right" style="font-size:12px"></i><span style="color:var(--text-primary)">${d.icon} ${esc(d.title)}</span>
          ${d.draft ? '<span class="chip draft" title="Only you and your Draft collaborators can see this"><i class="ti ti-lock"></i>Draft</span>' : ''}</div>
        <span class="saved" id="saved">Saved</span>
        ${d.draft && d.author === ME ? `<button class="btn sm ghost" data-act="collaborators"><i class="ti ti-users"></i> ${d.collaborators.length ? d.collaborators.map((c) => avatar(c, 'sm')).join('') : 'Collaborators'}</button><button class="btn sm primary" data-act="publish">Publish</button>` : ''}
        <button class="icon-btn" data-act="star" aria-pressed="${!!d.star}" aria-label="${d.star ? 'Unstar' : 'Star'}"><i class="ti ti-star${d.star ? '-filled' : ''}" style="${d.star ? 'color:#cb912f' : ''}"></i></button>
        <button class="icon-btn" data-act="side" data-side="comments" aria-label="Comments" style="${S.side === 'comments' ? 'background:var(--surface-selected)' : ''}"><i class="ti ti-message"></i>${openThreads ? `<span class="dot">${openThreads}</span>` : ''}</button>
        <button class="icon-btn" data-act="side" data-side="history" aria-label="Version history" style="${S.side === 'history' ? 'background:var(--surface-selected)' : ''}"><i class="ti ti-history"></i></button>
        <button class="icon-btn" data-act="docMenu" aria-label="More"><i class="ti ti-dots"></i></button>
      </div>
      ${v ? `<div class="banner"><i class="ti ti-history"></i><span style="flex:1">You are reading the version from <b>${v.when}</b>${v.name ? `, “${esc(v.name)}”` : ''}. It is read-only.</span><button class="btn sm" data-act="backToCurrent">Back to the current Document</button></div>` : ''}
      <div class="doc-wrap ${S.side ? 'side' : ''}">
        <div>
          <div class="cover" style="${d.cover ? coverCss(d.cover) : 'height:56px'}">${d.cover ? `<button class="btn sm chg" data-act="cover">Change cover</button>` : `<button class="btn sm ghost" style="position:absolute;left:calc(50% - 360px + 48px);bottom:4px" data-act="cover"><i class="ti ti-photo"></i> Add cover</button>`}</div>
          <div class="doc">
            <button class="doc-icon" data-act="emoji" aria-label="Change icon" style="${d.cover ? '' : 'margin-top:0'}">${d.icon}</button>
            <h1 class="doc-title" id="doc-title" ${v ? '' : 'contenteditable="true"'} data-ph="Untitled">${esc(d.title)}</h1>
            <div class="doc-meta">${avatar(d.author, 'sm')}<span>${esc(people[d.author].name)}</span><span>Edited ${d.edited}</span>${d.draft ? `<span>Visible to you${d.collaborators.length ? ` and ${d.collaborators.map(firstName).join(', ')}` : ''}</span>` : `<span>Visible to everyone in ${esc(projectOf(sp.project).name)}</span>`}</div>
            <div class="ed" id="ed" data-doc="${d.id}" ${v ? 'data-readonly' : ''}>${d.html}</div>
          </div>
        </div>
        <aside class="side" aria-label="${S.side === 'history' ? 'Version history' : 'Comments'}"><div class="side-in">${S.side === 'history' ? historyPanel(d) : S.side === 'comments' ? commentsPanel(d) : ''}</div></aside>
      </div>`;
  }

  function historyPanel(d) {
    const vs = versions[d.id] || (versions[d.id] = [{ id: d.id + '-v1', who: d.author, when: d.edited }]);
    return `<div class="side-h">Version history<button class="icon-btn" data-act="side" data-side="history" aria-label="Close"><i class="ti ti-x"></i></button></div>
      <button class="btn sm" style="width:100%;justify-content:center;margin-bottom:10px" data-act="nameVersion"><i class="ti ti-bookmark-plus"></i> Name this version</button>
      ${vs.map((v) => `<div class="ver ${v.name ? 'named' : ''} ${S.viewVersion === v.id ? 'on' : ''}" data-act="viewVersion" data-id="${v.id}"><span class="dotl"></span><div style="flex:1"><div style="font-weight:500">${v.name ? esc(v.name) : v.when}</div><div class="subtle" style="font-size:11.5px">${v.name ? v.when + ' · ' : ''}${esc(people[v.who].name)}${v.name ? '' : ' · automatic'}</div></div></div>`).join('')}
      <p class="subtle" style="font-size:11.5px;margin-top:12px">A version is taken automatically once editors go quiet. Several people can edit at once, so a version marks a moment rather than a save. Every version is kept.</p>`;
  }

  function commentsPanel(d) {
    const ts = threads.filter((t) => t.doc === d.id);
    const open = ts.filter((t) => !t.resolved), done = ts.filter((t) => t.resolved);
    const th = (t) => `<div class="thread" data-thread-card="${t.id}">${t.quote ? `<div class="q">“${esc(t.quote)}”</div>` : '<div class="q" style="border-color:var(--border-strong)">On the whole Document</div>'}
      ${t.comments.map((c) => `<div style="margin-bottom:8px"><div style="display:flex;gap:6px;align-items:center;font-size:12px">${avatar(c.who, 'sm')}<b style="font-weight:500">${esc(people[c.who].name)}</b><span class="subtle">${c.when}</span></div><div style="font-size:13px;margin:3px 0 0 26px">${esc(c.text)}</div></div>`).join('')}
      ${t.resolved ? `<button class="btn sm" data-act="reopen" data-id="${t.id}">Reopen</button>` : `<form data-form="reply" data-id="${t.id}" style="display:flex;gap:6px;margin-top:4px"><input class="input" style="height:28px" placeholder="Reply" aria-label="Reply" /><button class="btn sm" data-act="resolve" data-id="${t.id}" type="button"><i class="ti ti-check"></i> Resolve</button></form>`}</div>`;
    return `<div class="side-h">Comments<button class="icon-btn" data-act="side" data-side="comments" aria-label="Close"><i class="ti ti-x"></i></button></div>
      ${open.map(th).join('') || '<p class="subtle" style="font-size:12.5px">No open Threads. Select text in the Document and press Comment to start one.</p>'}
      <form data-form="docComment" style="margin:6px 0 14px"><textarea class="input" placeholder="Comment on the whole Document" aria-label="Comment on the whole Document" style="min-height:52px"></textarea><button class="btn sm" style="margin-top:6px">Comment</button></form>
      ${done.length ? `<details><summary class="subtle" style="font-size:12px;cursor:pointer">Resolved (${done.length})</summary><div style="margin-top:8px">${done.map(th).join('')}</div></details>` : ''}`;
  }

  // ---------------------------------------------------- after-render hooks --

  function hydrate(r) {
    if (r.n === 'project-board') bindBoard();
    if (r.n === 'doc') hydrateDoc();
    if (S.guardUntil > Date.now()) tickGuard();
  }

  function hydrateDoc() {
    const ed = $('#ed'); if (!ed) return;
    const ro = ed.hasAttribute('data-readonly');
    if (ro) $$('[contenteditable="true"]', ed).forEach((n) => n.setAttribute('contenteditable', 'false'));
    $$('[data-ref]', ed).forEach((n) => { const i = issueById(n.dataset.ref); n.innerHTML = `<span class="key">${i.id}</span>${esc(i.title)}`; n.title = STATUS[i.status].label; });
    $$('[data-embed]', ed).forEach(fillEmbed);
    refreshToc();
    $$('mark.anchor', ed).forEach((m) => { const t = threads.find((x) => x.id === m.dataset.thread); m.classList.toggle('anchor', !!t && !t.resolved); });
  }
  function fillEmbed(n) {
    const q = new URLSearchParams(n.dataset.embed.replace(/&amp;/g, '&'));
    const f = filterOf(q); const list = issues.filter((i) => matches(i, f));
    const sp = runningSprint(f.project?.[0]);
    n.innerHTML = `<div class="embed-h"><i class="ti ti-list-details"></i><span style="flex:1">Issue list · ${esc(projectOf(f.project[0]).name)}${sp ? ` · ${sp.name}` : ''} · not done</span><a href="#" data-go="${pathWith('/issues', f)}" style="color:var(--text-accent)">Open as a list</a></div>
      <ul class="rows">${list.map((i) => issueRow(i)).join('') || '<div class="empty" style="padding:16px">Everything in this Sprint is done.</div>'}</ul>`;
  }
  function refreshToc() {
    const ed = $('#ed'); if (!ed) return;
    const hs = $$('h2, h3', ed);
    hs.forEach((h, n) => { h.id = 'h-' + n; });
    $$('[data-toc]', ed).forEach((t) => {
      t.innerHTML = hs.length ? hs.map((h) => `<a href="#${h.id}" class="${h.tagName === 'H3' ? 'l3' : ''}" data-act="tocJump" data-to="${h.id}">${esc(h.textContent || 'Untitled heading')}</a>`).join('') : '<span class="subtle" style="font-size:13px">Add a heading and it appears here.</span>';
    });
  }

  function saveDocDraft() {
    const ed = $('#ed');
    if (!ed || ed.hasAttribute('data-readonly')) return;
    const d = docById(ed.dataset.doc); if (d) d.html = ed.innerHTML;
  }

  let saveTimer, quietTimer, dirty = false;
  function markEdited() {
    const s = $('#saved'); if (s) s.textContent = 'Saving…';
    dirty = true;
    clearTimeout(saveTimer); clearTimeout(quietTimer);
    saveTimer = setTimeout(() => { saveDocDraft(); const s2 = $('#saved'); if (s2) s2.textContent = 'Saved'; const d = docById($('#ed')?.dataset.doc); if (d) d.edited = 'just now'; }, 600);
    quietTimer = setTimeout(() => {
      const d = docById($('#ed')?.dataset.doc); if (!d || !dirty) return;
      dirty = false;
      (versions[d.id] ||= []).unshift({ id: 'v' + Date.now(), who: ME, when: 'Today, just now' });
      if (S.side === 'history') { const side = $('.side-in'); if (side) side.innerHTML = historyPanel(d); }
    }, 4000);
  }

  // Board drag and drop
  function bindBoard() {
    let dragId = null;
    $$('.bcard').forEach((c) => {
      c.addEventListener('dragstart', (e) => { dragId = c.dataset.card; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
      c.addEventListener('dragend', () => c.classList.remove('dragging'));
    });
    $$('.col').forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', (e) => {
        e.preventDefault(); col.classList.remove('over');
        const id = dragId || e.dataTransfer.getData('text/plain');
        setStatus(id, col.dataset.col);
      });
    });
  }
  function setStatus(id, status) {
    const i = issueById(id);
    if (!i || i.status === status) return;
    i.status = status;
    log(i, `moved it to ${STATUS[status].label}`);
    activity[0].text = `moved <b>${i.id}</b> to ${STATUS[status].label}`;
    activity[0].icon = STATUS[status].icon;
    render();
    $(`[data-card="${id}"]`)?.classList.add('flash');
    toast(`${i.id} moved to ${STATUS[status].label}`);
  }

  // ---------------------------------------------------------------- layer --

  function renderLayer() {
    const L = $('#layer');
    let html = '';
    if (S.pop) html += popHtml(S.pop);
    if (S.notif) html += notifPop();
    if (S.palette) html += paletteHtml();
    if (S.dialog) html += dialogHtml(S.dialog);
    L.innerHTML = html;
    if (S.palette) { const inp = $('#pal-in'); inp.value = S.palette.q; inp.focus(); renderPaletteResults(); }
    if (S.dialog) setTimeout(() => $('#layer .dialog [data-autofocus]')?.focus(), 20);
  }

  function popAt(el, extra = {}, align = 'left') {
    const r = el.getBoundingClientRect();
    return { x: align === 'right' ? Math.max(8, r.right - 220) : r.left, y: r.bottom + 4, ...extra };
  }

  function popHtml(p) {
    const style = `left:${Math.min(p.x, innerWidth - 250)}px;top:${Math.min(p.y, innerHeight - 260)}px`;
    if (p.kind === 'filter') {
      const fd = FIELDS.find((x) => x.id === p.field);
      const f = filterOf(parse(S.path).q);
      const vals = f[fd.id] || [];
      return `<div class="pop" style="${style}" role="listbox" aria-label="${fd.label}"><div class="pop-h">${fd.label}: any of</div>${fd.values.map((v) => `<button class="opt ${vals.includes(v) ? 'sel' : ''}" data-act="toggleValue" data-field="${fd.id}" data-value="${v}" role="option" aria-selected="${vals.includes(v)}"><span class="ck"><i class="ti ti-check"></i></span>${fd.show(v)}</button>`).join('')}</div>`;
    }
    if (p.kind === 'prop') {
      const i = issueById(p.id);
      const opts = p.prop === 'status' ? Object.keys(STATUS).map((s) => [s, statusChip(s)]) : p.prop === 'priority' ? Object.keys(PRIORITY).map((s) => [s, priChip(s)]) : [...['kd', 'ada', 'mira'].map((m) => [m, `${avatar(m, 'sm')} ${esc(people[m].name)}`]), ['', `${avatar(null, 'sm')} Unassigned`]];
      return `<div class="pop" style="${style}">${opts.map(([v, lbl]) => `<button class="opt ${(i[p.prop] || '') === v ? 'sel' : ''}" data-act="setProp" data-prop="${p.prop}" data-id="${p.id}" data-value="${v}">${lbl}</button>`).join('')}</div>`;
    }
    if (p.kind === 'user') {
      return `<div class="pop" style="left:58px;bottom:12px;top:auto;width:240px"><div style="display:flex;gap:10px;align-items:center;padding:6px 8px 10px">${avatar(ME, 'lg')}<div><b style="font-weight:600">Kova Developer</b><div class="subtle" style="font-size:12px">developer@xkye.dev · Owner</div></div></div><hr />
        <div class="pop-h">Theme</div>${['light', 'dark'].map((t) => `<button class="opt ${S.theme === t ? 'sel' : ''}" data-act="theme" data-theme="${t}"><span class="ck"><i class="ti ti-check"></i></span>${t === 'light' ? 'Light' : 'Dark'}</button>`).join('')}<hr />
        <button class="opt" data-go="/settings/tokens"><i class="ti ti-key"></i>Personal access tokens</button>
        <button class="opt" data-act="signOut"><i class="ti ti-logout"></i>Sign out</button></div>`;
    }
    if (p.kind === 'member') {
      const m = people[p.id];
      const items = m.status === 'active'
        ? [m.owner ? ['Remove as Owner', 'demote', true] : ['Make Owner', 'makeOwner', true], ['Suspend', 'suspend', m.owner]]
        : m.status === 'suspended' ? [['Restore', 'restore', false], ['Remove from Kova', 'remove', true]]
        : [['Send the invitation again', 'resendP', false], ['Cancel invitation', 'cancelP', false]];
      return `<div class="pop" style="${style}">${items.map(([l, a, g]) => `<button class="opt" data-act="memberAct" data-do="${a}" data-id="${p.id}" ${a === 'remove' ? 'style="color:var(--danger)"' : ''}>${l}${g ? '<i class="ti ti-shield-lock subtle" style="margin-left:auto" title="Asks for a Confirmation code"></i>' : ''}</button>`).join('')}</div>`;
    }
    if (p.kind === 'emoji') {
      return `<div class="pop" style="${style};width:260px"><div class="pop-h">Icon</div><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:2px">${EMOJI.map((e) => `<button class="opt" style="justify-content:center;padding:0;font-size:17px" data-act="setIcon" data-e="${e}">${e}</button>`).join('')}</div></div>`;
    }
    if (p.kind === 'slash') {
      return `<div class="pop slash" style="${style}" id="slash"><div class="pop-h">Blocks</div>${SLASH.map((s, n) => `<button class="opt ${n === (p.i || 0) ? 'kb' : ''}" data-act="slashPick" data-n="${n}"><i class="ti ti-${s.icon}"></i>${s.label}</button>`).join('')}</div>`;
    }
    if (p.kind === 'docMenu') {
      const d = docById(parse(S.path).id);
      return `<div class="pop" style="${style}">
        <button class="opt" data-act="copyLink"><i class="ti ti-link"></i>Copy link</button>
        <button class="opt" data-act="focusMode"><i class="ti ti-focus-2"></i>Focus mode</button><hr />
        ${d.draft ? `<button class="opt" data-act="trashDoc" style="color:var(--danger)"><i class="ti ti-trash"></i>Move to Trash</button>` : `<button class="opt" data-act="archiveDoc"><i class="ti ti-archive"></i>Archive</button>`}
        <div class="pop-h" style="padding-top:2px">${d.draft ? 'A Draft can go straight to the Trash.' : 'A published Document is archived before it can be deleted.'}</div></div>`;
    }
    return '';
  }

  const SLASH = [
    { label: 'Text', icon: 'letter-t', html: () => `<p contenteditable="true"></p>` },
    { label: 'Heading 2', icon: 'h-2', html: () => `<h2 contenteditable="true"></h2>` },
    { label: 'Heading 3', icon: 'h-3', html: () => `<h3 contenteditable="true"></h3>` },
    { label: 'Bulleted list', icon: 'list', html: () => `<ul><li contenteditable="true"></li></ul>` },
    { label: 'Toggle', icon: 'caret-right', html: () => `<details class="toggle" contenteditable="false" open><summary><i class="ti ti-chevron-right"></i> Toggle</summary><div><p contenteditable="true"></p></div></details>` },
    { label: 'Callout', icon: 'bulb', html: () => `<div class="callout" contenteditable="false"><span class="e">💡</span><div contenteditable="true"></div></div>` },
    { label: 'Table of contents', icon: 'list-tree', html: () => `<div class="toc" contenteditable="false" data-toc></div>` },
    { label: 'Issue list', icon: 'list-details', html: () => `<div class="embed" contenteditable="false" data-embed="project=DAL&amp;status=blocked"></div>` },
  ];

  function notifPop() {
    const r = $('.panel-head [data-act="bell"]')?.getBoundingClientRect() || { left: 200, bottom: 44 };
    return `<div class="pop notif-pop" style="left:${Math.min(r.left, innerWidth - 370)}px;top:${r.bottom + 4}px" role="dialog" aria-label="Notifications">
      <div style="display:flex;align-items:center;padding:6px 8px 8px"><b style="flex:1">Notifications</b><button class="read-btn" data-act="readAll">Mark all read</button></div>
      ${notifications.slice(0, 10).map(notifRow).join('')}
      <hr /><button class="opt" data-go="/notifications" style="justify-content:center;color:var(--text-accent)">See all notifications</button></div>`;
  }

  // ---- Command palette (KOV-034) ----
  const NAV_CMDS = [
    ['Home', '/', 'home'], ['My Work', '/my-work', 'checklist'], ['Notifications', '/notifications', 'bell'], ['Plan', '/plan', 'calendar-week'],
    ['Projects', '/projects', 'folders'], ['Issues', '/issues', 'circle-dot'], ['Activity', '/activity', 'history'], ['Kova Docs', '/docs', 'file-text'], ['Needs attention', '/admin', 'inbox'],
  ];
  function paletteItems() {
    const q = S.palette.q.trim().toLowerCase();
    const items = [];
    const cmds = [['New issue', 'newIssue', 'plus'], ['New document', 'newDoc', 'file-plus'], [S.theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme', 'toggleTheme', 'contrast']];
    cmds.filter(([l]) => !q || l.toLowerCase().includes(q)).forEach(([l, act, ic]) => items.push({ g: 'Actions', l, ic, act }));
    NAV_CMDS.filter(([l]) => !q || l.toLowerCase().includes(q)).forEach(([l, go, ic]) => items.push({ g: 'Go to', l, ic, go }));
    if (q) {
      const { is, ds } = searchAll(q);
      is.forEach((i) => items.push({ g: 'Issues', l: `<span class="key" style="width:54px;display:inline-block">${i.id}</span>${esc(i.title)}`, ic: STATUS[i.status].icon, go: `/issues/${i.id}` }));
      ds.forEach((d) => items.push({ g: 'Documents', l: `${d.icon} ${esc(d.title)}`, ic: 'file-text', go: `/docs/${d.space}/${d.id}` }));
    } else {
      issues.filter((i) => i.assignee === ME && OPEN.includes(i.status)).slice(0, 4).forEach((i) => items.push({ g: 'Assigned to you', l: `<span class="key" style="width:54px;display:inline-block">${i.id}</span>${esc(i.title)}`, ic: STATUS[i.status].icon, go: `/issues/${i.id}` }));
    }
    return items;
  }
  function paletteHtml() {
    return `<div class="scrim" data-act="closeAll"><div class="dialog palette" role="dialog" aria-label="Command palette" data-stop>
      <div class="in"><i class="ti ti-search"></i><input id="pal-in" placeholder="Search issues and documents, or type a command" autocomplete="off" aria-label="Command" /></div>
      <div class="res" id="pal-res"></div>
      <div class="foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> to move</span><span><span class="kbd">↵</span> to open</span><span><span class="kbd">esc</span> to close</span></div></div></div>`;
  }
  function renderPaletteResults() {
    const items = paletteItems();
    S.palette.items = items;
    S.palette.i = Math.min(S.palette.i, Math.max(0, items.length - 1));
    let g = null;
    $('#pal-res').innerHTML = items.length ? items.map((it, n) => `${it.g !== g ? `<div class="grp">${(g = it.g)}</div>` : ''}<button class="it ${n === S.palette.i ? 'kb' : ''}" data-act="palPick" data-n="${n}"><i class="ti ti-${it.ic} subtle"></i><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.l}</span></button>`).join('')
      : `<div class="empty">Nothing matches “${esc(S.palette.q)}”.</div>`;
    $('#pal-res .kb')?.scrollIntoView({ block: 'nearest' });
  }
  function palPick(n) {
    const it = S.palette.items[n]; if (!it) return;
    S.palette = null;
    if (it.go) nav(it.go); else { renderLayer(); A[it.act]?.(); }
  }

  // ---- Dialogs ----
  function dialogHtml(d) {
    const wrap = (title, sub, body, foot, w = '') => `<div class="scrim" data-act="closeAll"><form class="dialog" style="${w}" role="dialog" aria-modal="true" aria-label="${esc(title)}" data-form="${d.kind}" data-stop>
      <div class="dh"><h2>${title}</h2>${sub ? `<p class="muted" style="margin:0">${sub}</p>` : ''}</div><div class="db">${body}</div><div class="df">${foot}</div></form></div>`;
    const cancel = `<button type="button" class="btn" data-act="closeAll">Cancel</button>`;
    switch (d.kind) {
      case 'newIssue': {
        const pk = d.project || 'DAL';
        return wrap('New issue', '', `
          <label class="f" for="ni-title">Title</label><input class="input" id="ni-title" data-autofocus placeholder="What needs doing?" required />
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div><label class="f" for="ni-project">Project</label><select class="input" id="ni-project">${projects.filter((p) => ['active', 'planned'].includes(p.status)).map((p) => `<option value="${p.key}" ${p.key === pk ? 'selected' : ''}>${esc(p.name)} (${p.key})</option>`).join('')}</select></div>
            <div><label class="f" for="ni-status">Status</label><select class="input" id="ni-status">${['todo', 'in_progress'].map((s) => `<option value="${s}">${STATUS[s].label}</option>`).join('')}</select></div>
            <div><label class="f" for="ni-pri">Priority</label><select class="input" id="ni-pri">${Object.keys(PRIORITY).map((s) => `<option value="${s}" ${s === 'medium' ? 'selected' : ''}>${PRIORITY[s].label}</option>`).join('')}</select></div>
            <div><label class="f" for="ni-asg">Assignee</label><select class="input" id="ni-asg"><option value="kd">Me</option><option value="ada">Ada Admin</option><option value="mira">Mira Member</option><option value="">Unassigned</option></select></div>
          </div>
          <label class="f" for="ni-desc">Description</label><textarea class="input" id="ni-desc" placeholder="Markdown is supported"></textarea>`,
          `${cancel}<button class="btn primary">Create issue</button>`);
      }
      case 'saveFilter':
        return wrap('Save filter', 'A Saved filter is yours alone. It appears in your panel so you can apply it again.', `<label class="f" for="sf-name">Name</label><input class="input" id="sf-name" data-autofocus value="${esc(d.suggest)}" required /><p class="subtle mono" style="margin:8px 0 0;word-break:break-all">${esc(S.path)}</p>`, `${cancel}<button class="btn primary">Save filter</button>`);
      case 'publish': {
        const doc = docById(d.id);
        return wrap(`Publish “${esc(doc.title)}”?`, '', `<div class="notice"><i class="ti ti-world"></i><span>Everyone in ${esc(projectOf(spaceOf(doc.space).project).name)} will be able to find and read it, along with anything nested under it. Draft collaborators stop being a separate list, because everyone can now see it. Publishing can’t be undone, but you can archive the Document later.</span></div>`, `${cancel}<button class="btn primary" data-autofocus>Publish</button>`);
      }
      case 'collaborators': {
        const doc = docById(d.id); const proj = projectOf(spaceOf(doc.space).project);
        return wrap('Draft collaborators', `People in ${esc(proj.name)} you invite to see and edit this Draft before it is published.`, proj.members.filter((m) => m !== ME).map((m) => `<label class="opt" style="display:flex;gap:10px;align-items:center;height:40px;cursor:pointer"><input type="checkbox" name="collab" value="${m}" ${doc.collaborators.includes(m) ? 'checked' : ''} />${avatar(m, 'sm')} ${esc(people[m].name)}</label>`).join(''), `${cancel}<button class="btn primary">Save</button>`);
      }
      case 'nameVersion':
        return wrap('Name this version', 'A named version is easy to find again, for example “Sent to client”.', `<label class="f" for="nv">Name</label><input class="input" id="nv" data-autofocus placeholder="Sent to client" required />`, `${cancel}<button class="btn primary">Name version</button>`);
      case 'newDoc':
        return wrap('New document', 'It starts as a Draft that only you can see.', `<label class="f" for="nd-title">Title</label><input class="input" id="nd-title" data-autofocus placeholder="Untitled" />
          <label class="f" for="nd-space">Space</label><select class="input" id="nd-space">${spaces.map((s) => `<option value="${s.slug}">${esc(s.name)}</option>`).join('')}</select>`, `${cancel}<button class="btn primary">Create Draft</button>`);
      case 'invite':
        return wrap('Invite someone to Kova', 'They can accept for 24 hours. You can send it again after that.', `<label class="f" for="iv-email">Email</label><input class="input" id="iv-email" type="email" data-autofocus placeholder="name@xkye.dev" required />
          <div id="iv-domain" class="notice" style="display:none;margin-top:10px"><i class="ti ti-alert-circle"></i><label style="display:flex;gap:8px;align-items:flex-start"><span>This address isn’t at a usual email domain for Xkye (xkye.dev). <input type="checkbox" id="iv-ok" style="vertical-align:middle" /> I meant to invite it.</span></label></div>
          <label class="f">Projects they can reach</label>${projects.filter((p) => p.status === 'active').map((p) => `<label style="display:flex;gap:8px;align-items:center;height:30px"><input type="checkbox" name="ivp" value="${p.key}" ${p.key === 'DAL' ? 'checked' : ''} />${projIc(p.key, 16)} ${esc(p.name)}</label>`).join('')}`,
          `${cancel}<button class="btn primary">Send invitation</button>`);
      case 'confirm':
        return wrap(d.title, '', `<div class="notice"><i class="ti ti-info-circle"></i><span>${d.body}</span></div>`, `${cancel}<button class="btn ${d.danger ? 'danger' : 'primary'}" data-autofocus>${d.ok}</button>`);
      case 'code':
        return wrap('Enter the Confirmation code', `We emailed a six-digit code to developer@xkye.dev. The email names this act: <b style="color:var(--text-primary)">${esc(d.label)}</b>.`,
          `<div class="code-boxes" id="code-boxes">${[0, 1, 2, 3, 4, 5].map((n) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${n + 1}" ${n === 0 ? 'data-autofocus' : ''} />`).join('')}</div>
          <p class="subtle" style="font-size:12px;margin:8px 0 0">In this prototype, any six digits work. Once confirmed, guarded acts are let through in this browser for five minutes. The code confirms an act; it doesn’t sign anyone in.</p>`,
          `${cancel}<button class="btn primary" id="code-ok" disabled>Confirm</button>`);
      case 'token':
        return d.secret
          ? wrap('Copy your token now', 'You won’t be able to see it again. Kova stores only a digest of it.', `<div class="input mono" style="display:flex;align-items:center;height:38px;font-size:12px;user-select:all">${d.secret}</div><p class="subtle" style="font-size:12px;margin:10px 0 0">Then run <code class="mono">kova auth login</code> and paste it at the masked prompt.</p>`, `<button type="button" class="btn primary" data-act="closeAll">Done</button>`)
          : wrap('Create a personal access token', '', `<label class="f" for="tk-name">Name</label><input class="input" id="tk-name" data-autofocus placeholder="Work laptop" required />
            <label class="f" for="tk-scope">Reaches</label><select class="input" id="tk-scope"><option>Every Project I can reach</option>${projects.filter((p) => p.status === 'active').map((p) => `<option>${esc(p.name)} only</option>`).join('')}</select>
            <label class="f" for="tk-exp">Expires</label><select class="input" id="tk-exp"><option>In 90 days</option><option>In 30 days</option><option>In a year</option></select>`, `${cancel}<button class="btn primary">Create token</button>`);
    }
    return '';
  }

  function closeAll() { S.pop = null; S.notif = false; S.palette = null; S.dialog = null; renderLayer(); }

  // Guarded acts (Confirmation code)
  function guarded(label, fn) {
    if (S.guardUntil > Date.now()) { fn(); return; }
    S.pop = null;
    S.dialog = { kind: 'code', label, fn };
    renderLayer();
  }
  let guardTimer;
  function tickGuard() {
    clearInterval(guardTimer);
    const tick = () => {
      const left = Math.max(0, S.guardUntil - Date.now());
      const el = $('#guard-left');
      if (el) el.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')} left`;
      if (!left) { clearInterval(guardTimer); render(); }
    };
    tick(); guardTimer = setInterval(tick, 1000);
  }

  function suspend(id) {
    const p = people[id];
    const mine = issues.filter((i) => i.assignee === id && OPEN.includes(i.status));
    mine.forEach((i) => { i.assignee = null; i.log.push({ who: ME, text: `suspended ${p.name}, which unassigned this issue`, when: 'Just now' }); });
    p.status = 'suspended'; p.suspendedDays = 0;
    render();
    toast(`${p.name} suspended. ${mine.length} unfinished issue${mine.length === 1 ? '' : 's'} unassigned.`, 'player-pause');
  }

  // --------------------------------------------------------------- actions --

  const A = {
    closeAll,
    area(el) {
      const area = el.dataset.area;
      const here = areaOf(parse(S.path));
      nav(area === here ? { kova: '/', docs: '/docs', admin: '/admin' }[area] : remembered[area]);
    },
    collapse() { S.collapsed = !S.collapsed; render(); },
    palette() { S.pop = null; S.notif = false; S.palette = { q: '', i: 0 }; renderLayer(); },
    docSearch() { A.palette(); },
    bell(el) { S.pop = null; S.notif = !S.notif; renderLayer(); },
    markRead(el, e) { e?.stopPropagation(); const n = notifications.find((x) => x.id === el.dataset.id); n.read = true; render(); },
    readAll() { notifications.forEach((n) => { n.read = true; }); render(); toast('All notifications marked read'); },
    openNotif(el) { const n = notifications.find((x) => x.id === el.dataset.id); n.read = true; nav(n.go); },
    userMenu() { S.notif = false; S.pop = S.pop?.kind === 'user' ? null : { kind: 'user' }; renderLayer(); },
    theme(el) { S.theme = el.dataset.theme; S.pop = null; render(); report(); },
    toggleTheme() { S.theme = S.theme === 'dark' ? 'light' : 'dark'; render(); report(); },
    signOut() { S.signedIn = false; S.pop = null; nav('/sign-in'); },
    soon(el) { toast(`${el.dataset.what} isn’t part of this prototype`, 'info-circle'); },
    filter(el) {
      S.pop = S.pop?.kind === 'filter' && S.pop.field === el.dataset.field ? null : popAt(el, { kind: 'filter', field: el.dataset.field });
      renderLayer();
    },
    toggleValue(el) {
      const r = parse(S.path);
      const f = filterOf(r.q);
      const field = el.dataset.field, v = el.dataset.value;
      const cur = new Set(f[field] || []);
      cur.has(v) ? cur.delete(v) : cur.add(v);
      f[field] = [...cur];
      const base = S.path.split('?')[0];
      if (r.key) delete f.project;
      nav(pathWith(base, f), { keep: true });
    },
    saveFilter() {
      const f = filterOf(parse(S.path).q);
      const suggest = FIELDS.filter((fd) => f[fd.id]?.length).map((fd) => f[fd.id].map((v) => short(fd.id, v)).join(' or ')).join(', ');
      S.dialog = { kind: 'saveFilter', suggest }; renderLayer();
    },
    copyLink() { S.pop = null; renderLayer(); navigator.clipboard?.writeText(location.origin + location.pathname + '#' + S.path).catch(() => {}); toast('Link copied. Whoever opens it sees the same view.', 'link'); },
    cliHint(el) { toast(`kova issue ${el.dataset.id.toLowerCase()}`, 'terminal-2'); },
    newIssue(el) { S.palette = null; S.dialog = { kind: 'newIssue', project: el?.dataset?.project || parse(S.path).key }; renderLayer(); },
    prop(el) { S.pop = popAt(el, { kind: 'prop', prop: el.dataset.prop, id: el.dataset.id }); renderLayer(); },
    setProp(el) {
      const i = issueById(el.dataset.id); const prop = el.dataset.prop; const v = el.dataset.value || null;
      S.pop = null;
      if ((i[prop] || null) === v) { renderLayer(); return; }
      i[prop] = v;
      log(i, prop === 'status' ? `moved it to ${STATUS[v].label}` : prop === 'priority' ? `set the priority to ${PRIORITY[v].label}` : v ? `assigned it to ${people[v].name}` : 'unassigned it');
      render();
      toast(`${i.id} updated`);
    },
    toSprint(el, e) { e.stopPropagation(); const i = issueById(el.dataset.id); i.sprint = el.dataset.sprint; log(i, `planned it into ${sprints[i.sprint].name}`); render(); toast(`${i.id} moved to ${sprints[i.sprint].name}`); },
    toBacklog(el, e) { e.stopPropagation(); const i = issueById(el.dataset.id); const was = sprints[i.sprint].name; i.sprint = null; log(i, `moved it from ${was} to the Backlog`); render(); toast(`${i.id} moved to the Backlog`); },
    palPick(el) { palPick(+el.dataset.n); },

    // Admin
    resend() { people.pat.expired = false; S.attention = S.attention.filter((a) => a.id !== 'att-pat'); render(); toast('Invitation sent again to pat@xkye.dev. It can be accepted for 24 hours.', 'mail'); },
    cancelInvite() { people.pat.status = 'removed'; S.attention = S.attention.filter((a) => a.id !== 'att-pat'); render(); toast('Invitation cancelled. Things are as they were before it was sent.'); },
    restoreSam() { people.sam.status = 'active'; people.sam.last = 'Just now'; S.attention = S.attention.filter((a) => a.id !== 'att-sam'); render(); toast('Sam Suspended restored. Their old assignments were not given back.'); },
    removeSam() { A.memberAct({ dataset: { do: 'remove', id: 'sam' } }); },
    keepSam() { S.attention = S.attention.filter((a) => a.id !== 'att-sam'); render(); toast('Kept as is until the next review'); },
    memberMenu(el) { S.pop = popAt(el, { kind: 'member', id: el.dataset.id }, 'right'); renderLayer(); },
    memberAct(el) {
      const id = el.dataset.id, p = people[id], act = el.dataset.do;
      S.pop = null;
      const done = (msg) => { S.attention = S.attention.filter((a) => !(id === 'sam' && a.id === 'att-sam') && !(id === 'pat' && a.id === 'att-pat')); render(); toast(msg); };
      if (act === 'makeOwner') guarded(`Make ${p.name} an Owner`, () => { p.owner = true; done(`${p.name} is now an Owner`); });
      else if (act === 'demote') guarded(`Remove ${p.name} as an Owner`, () => { p.owner = false; done(`${p.name} is no longer an Owner. They have been told.`); });
      else if (act === 'suspend') {
        const n = issues.filter((i) => i.assignee === id && OPEN.includes(i.status)).length;
        const go = () => { S.dialog = { kind: 'confirm', title: `Suspend ${p.name}?`, ok: 'Suspend', danger: true, body: `They won’t be able to use Kova and their access tokens are revoked. Their Project memberships, history and name stay, and you can restore them. Their ${n} unfinished issue${n === 1 ? ' is' : 's are'} unassigned now, and restoring them won’t assign ${n === 1 ? 'it' : 'them'} again.`, fn: () => suspend(id) }; renderLayer(); };
        p.owner ? guarded(`Suspend ${p.name}, an Owner`, go) : go();
      } else if (act === 'restore') { p.status = 'active'; p.last = 'Just now'; done(`${p.name} restored. Their old assignments were not given back.`); }
      else if (act === 'remove') guarded(`Remove ${p.name} from Kova`, () => {
        S.dialog = { kind: 'confirm', title: `Remove ${p.name} from Kova?`, ok: 'Remove from Kova', danger: true, body: 'Their name and history stay. Every Project membership and unfinished assignment they held is gone. This can’t be undone: they can only be invited again, and would come back with nothing granted.', fn: () => { p.status = 'removed'; done(`${p.name} removed from Kova`); } };
        renderLayer();
      });
      else if (act === 'resendP') { p.expired = false; done('Invitation sent again'); }
      else if (act === 'cancelP') { p.status = 'removed'; done('Invitation cancelled'); }
    },
    invite() { S.dialog = { kind: 'invite' }; renderLayer(); },
    newToken() { S.dialog = { kind: 'token' }; renderLayer(); },
    revokeToken(el) { const n = tokens.findIndex((t) => t.id === el.dataset.id); const [t] = tokens.splice(n, 1); render(); toast(`“${t.name}” revoked. The CLI using it is signed out.`); },

    // Docs
    newDoc() { S.palette = null; S.dialog = { kind: 'newDoc' }; renderLayer(); },
    star() { const d = docById(parse(S.path).id); d.star = !d.star; render(); toast(d.star ? 'Starred' : 'Removed from Starred', 'star'); },
    side(el) { S.side = S.side === el.dataset.side ? null : el.dataset.side; if (S.side !== 'history') S.viewVersion = null; render(); },
    publish() { S.dialog = { kind: 'publish', id: parse(S.path).id }; renderLayer(); },
    collaborators() { S.dialog = { kind: 'collaborators', id: parse(S.path).id }; renderLayer(); },
    nameVersion() { S.dialog = { kind: 'nameVersion' }; renderLayer(); },
    viewVersion(el) { saveDocDraft(); S.viewVersion = el.dataset.id === (versions[parse(S.path).id] || [])[0]?.id ? null : el.dataset.id; render(); },
    backToCurrent() { S.viewVersion = null; render(); },
    cover() { const d = docById(parse(S.path).id); saveDocDraft(); const n = COVERS.indexOf(d.cover); d.cover = COVERS[(n + 1) % COVERS.length]; render(); },
    emoji(el) { S.pop = popAt(el, { kind: 'emoji' }); renderLayer(); },
    setIcon(el) { const d = docById(parse(S.path).id); d.icon = el.dataset.e; S.pop = null; render(); },
    docMenu(el) { S.pop = popAt(el, { kind: 'docMenu' }, 'right'); renderLayer(); },
    focusMode() { S.pop = null; S.collapsed = true; S.side = null; render(); toast('Focus mode: the panel is folded. Press ⌘B to bring it back.', 'focus-2'); },
    trashDoc() { const d = docById(parse(S.path).id); d.trashed = true; nav('/docs'); toast(`“${d.title}” moved to the Trash. It waits there for 30 days.`, 'trash'); },
    archiveDoc() { const d = docById(parse(S.path).id); d.trashed = true; nav('/docs'); toast(`“${d.title}” archived. Links to it still work.`, 'archive'); },
    resolve(el) { const t = threads.find((x) => x.id === el.dataset.id); t.resolved = true; render(); toast('Thread resolved. You can reopen it from Resolved.'); },
    reopen(el) { const t = threads.find((x) => x.id === el.dataset.id); t.resolved = false; render(); },
    tocJump(el) { $('#' + el.dataset.to)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    slashPick(el) { slashPick(+el.dataset.n); },
  };

  function slashPick(n) {
    const target = S.slashTarget; S.pop = null; renderLayer();
    if (!target || !target.isConnected) return;
    const tpl = document.createElement('div');
    tpl.innerHTML = SLASH[n].html();
    const node = tpl.firstElementChild;
    const host = target.tagName === 'LI' && target.parentElement.children.length === 1 ? target.parentElement : target;
    host.replaceWith(node);
    hydrateDoc();
    markEdited();
    const focusable = node.matches('[contenteditable="true"]') ? node : node.querySelector('[contenteditable="true"]');
    focusable?.focus();
  }

  // ---------------------------------------------------------------- forms --

  const FORMS = {
    signin() { S.signedIn = true; nav('/'); },
    comment(form) {
      const t = $('#comment-box').value.trim(); if (!t) return;
      const i = issueById(form.dataset.id);
      i.comments.push({ who: ME, when: 'Just now', text: t });
      activity.unshift({ who: ME, icon: 'message', text: `commented on <b>${i.id}</b>`, project: i.project, when: 'Just now' });
      render(); toast('Comment posted');
    },
    newIssue() {
      const key = $('#ni-project').value;
      const id = `${key}-${nextNumber[key]++}`;
      const t = $('#ni-title').value.trim(); if (!t) return;
      const i = I(id, t, $('#ni-status').value, $('#ni-pri').value, $('#ni-asg').value || null, { desc: $('#ni-desc').value ? `<p>${esc($('#ni-desc').value)}</p>` : '', created: 'Just now' });
      i.log.push({ who: ME, text: 'created the issue', when: 'Just now' });
      issues.push(i);
      activity.unshift({ who: ME, icon: 'circle-plus', text: `created <b>${id}</b> ${esc(t)}`, project: key, when: 'Just now' });
      nav(`/issues/${id}`);
      toast(`Created ${id}. Keys are allocated per Project and never reused.`);
    },
    saveFilter() { const name = $('#sf-name').value.trim() || 'Untitled filter'; S.saved.push({ name, path: S.path }); S.dialog = null; render(); toast(`Saved “${name}”. It’s in your panel, visible only to you.`, 'bookmark'); },
    publish() { const d = docById(S.dialog.id); d.draft = false; d.collaborators = []; S.dialog = null; render(); toast(`Published. Everyone in ${projectOf(spaceOf(d.space).project).name} can read it now.`, 'world'); },
    collaborators(form) { const d = docById(S.dialog.id); d.collaborators = $$('input[name="collab"]:checked', form).map((c) => c.value); S.dialog = null; render(); toast('Draft collaborators updated'); },
    nameVersion() { const d = docById(parse(S.path).id); const name = $('#nv').value.trim(); if (!name) return; (versions[d.id] ||= []).unshift({ id: 'n' + Date.now(), who: ME, when: 'Today, just now', name }); S.dialog = null; S.side = 'history'; render(); toast(`Named “${name}”`, 'bookmark'); },
    newDoc() {
      const title = $('#nd-title').value.trim() || 'Untitled';
      const space = $('#nd-space').value;
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);
      docs.push({ id, space, title, icon: '📝', cover: null, parent: null, draft: true, author: ME, collaborators: [], edited: 'just now', recent: 0.1, html: `<p contenteditable="true" data-ph="Type / for blocks"></p>` });
      nav(`/docs/${space}/${id}`);
      setTimeout(() => $('#ed p')?.focus(), 30);
    },
    invite(form) {
      const email = $('#iv-email').value.trim();
      const outside = !/@xkye\.dev$/i.test(email);
      if (outside && !$('#iv-ok').checked) { $('#iv-domain').style.display = 'flex'; $('#iv-ok').focus(); return; }
      const id = 'p' + Date.now();
      people[id] = { name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), ini: email.slice(0, 2).toUpperCase(), email, owner: false, status: 'invited', color: '#2d6d95', last: 'Never' };
      S.dialog = null; render(); toast(`Invitation sent to ${esc(email)}. It can be accepted for 24 hours.`, 'mail');
    },
    confirm() { const fn = S.dialog.fn; S.dialog = null; renderLayer(); fn(); },
    code() { const fn = S.dialog.fn; S.dialog = null; S.guardUntil = Date.now() + 5 * 60 * 1000; renderLayer(); fn(); if (parse(S.path).n === 'members') render(); },
    token() {
      if (S.dialog.secret) return closeAll();
      const name = $('#tk-name').value.trim() || 'Untitled token';
      tokens.unshift({ id: 'tk' + Date.now(), name, scope: $('#tk-scope').value, created: '16 Oct', used: 'Never', expires: '14 Jan 2027' });
      const rnd = [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, '0')).join('');
      S.dialog = { kind: 'token', secret: `kova_pat_${rnd}` };
      render();
    },
    reply(form) { const inp = form.querySelector('input'); const t = inp.value.trim(); if (!t) return; threads.find((x) => x.id === form.dataset.id).comments.push({ who: ME, when: 'Just now', text: t }); render(); },
    docComment(form) { const t = form.querySelector('textarea').value.trim(); if (!t) return; threads.push({ id: 't' + Date.now(), doc: parse(S.path).id, quote: null, resolved: false, comments: [{ who: ME, when: 'Just now', text: t }] }); render(); },
  };

  // ---------------------------------------------------------------- events --

  document.addEventListener('click', (e) => {
    // The innermost element that says what a click means wins.
    const t = e.target.closest('[data-act], [data-go]');
    if (t?.dataset.act === 'closeAll') {
      // A click inside a dialog bubbles up to its scrim; only the scrim itself, or a Cancel button, closes it.
      if (t.classList.contains('scrim') && e.target !== t) return;
      e.preventDefault(); closeAll(); return;
    }
    if (t?.dataset.act) { e.preventDefault(); A[t.dataset.act]?.(t, e); return; }
    if (t?.dataset.go) { e.preventDefault(); nav(t.dataset.go); return; }
    const mark = e.target.closest('mark.anchor');
    if (mark) { S.side = 'comments'; render(); return; }
    if (!e.target.closest('.pop') && (S.pop || S.notif)) { S.pop = null; S.notif = false; renderLayer(); }
  });

  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    FORMS[f.dataset.form]?.(f);
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'pal-in') { S.palette.q = t.value; S.palette.i = 0; renderPaletteResults(); return; }
    if (t.id === 'doc-filter') { const q = t.value.toLowerCase(); $$('#doc-tiles .doc-tile').forEach((n) => { n.style.display = n.dataset.title.includes(q) ? '' : 'none'; }); return; }
    if (t.id === 'search-page') { const { is, ds } = searchAll(t.value); $('#search-results').innerHTML = searchResults(t.value, is, ds); S.path = '/search' + (t.value ? '?q=' + encodeURIComponent(t.value) : ''); report(); return; }
    if (t.id === 'iv-email') { $('#iv-domain').style.display = 'none'; return; }
    if (t.closest('#code-boxes')) {
      const boxes = $$('#code-boxes input');
      const digits = t.value.replace(/\D/g, '');
      if (digits.length > 1) { digits.slice(0, 6).split('').forEach((d, n) => { boxes[n].value = d; }); }
      else { t.value = digits; if (digits) boxes[boxes.indexOf(t) + 1]?.focus(); }
      $('#code-ok').disabled = boxes.some((b) => !b.value);
      return;
    }
    if (t.id === 'doc-title') { const d = docById(parse(S.path).id); d.title = t.textContent.trim() || 'Untitled'; const lbl = $(`[data-tree="${d.id}"] .lbl`); if (lbl) lbl.textContent = d.title; markEdited(); return; }
    if (t.closest('#ed')) { markEdited(); if (/^H[23]$/.test(t.tagName)) refreshToc(); }
  });

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!(e.target instanceof Element)) return;
    const typing = e.target.closest('input, textarea, [contenteditable="true"], select');
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); S.palette ? closeAll() : A.palette(); return; }
    if (mod && e.key.toLowerCase() === 'b') { e.preventDefault(); A.collapse(); return; }
    if (e.key === 'Escape') { if (S.palette || S.dialog || S.pop || S.notif) { closeAll(); e.preventDefault(); } return; }

    if (S.palette && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      e.preventDefault();
      if (e.key === 'Enter') return palPick(S.palette.i);
      S.palette.i = (S.palette.i + (e.key === 'ArrowDown' ? 1 : -1) + S.palette.items.length) % Math.max(1, S.palette.items.length);
      return renderPaletteResults();
    }
    if (S.pop?.kind === 'slash') {
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); S.pop.i = ((S.pop.i || 0) + (e.key === 'ArrowDown' ? 1 : -1) + SLASH.length) % SLASH.length; renderLayer(); return; }
      if (e.key === 'Enter') { e.preventDefault(); slashPick(S.pop.i || 0); return; }
    }
    if (e.target.closest('#code-boxes') && e.key === 'Backspace' && !e.target.value) { const boxes = $$('#code-boxes input'); boxes[boxes.indexOf(e.target) - 1]?.focus(); return; }

    // Editor keys
    const block = e.target.closest('#ed [contenteditable="true"]');
    if (block) {
      if (e.key === '/' && !block.textContent.trim()) {
        e.preventDefault(); S.slashTarget = block; S.pop = popAt(block, { kind: 'slash', i: 0 }); renderLayer(); return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const isLi = block.tagName === 'LI';
        if (isLi && !block.textContent.trim()) { const ul = block.parentElement; block.remove(); const p = Object.assign(document.createElement('p'), { contentEditable: 'true' }); p.dataset.ph = 'Type / for blocks'; ul.after(p); if (!ul.children.length) ul.remove(); p.focus(); markEdited(); return; }
        const el = document.createElement(isLi ? 'li' : 'p');
        el.contentEditable = 'true'; el.dataset.ph = 'Type / for blocks';
        const anchor = isLi ? block : (block.closest('.callout, .toggle') || block);
        anchor.after(el); el.focus(); markEdited(); return;
      }
      if (e.key === 'Backspace' && !block.textContent && $$('#ed [contenteditable="true"]').length > 1) {
        e.preventDefault();
        const all = $$('#ed [contenteditable="true"]'); const prev = all[all.indexOf(block) - 1];
        const ul = block.tagName === 'LI' ? block.parentElement : null;
        block.remove(); if (ul && !ul.children.length) ul.remove();
        if (prev) { prev.focus(); const s = getSelection(); s.selectAllChildren(prev); s.collapseToEnd(); }
        refreshToc(); markEdited(); return;
      }
    }

    if (typing) return;
    const r = parse(S.path);
    if (r.n === 'issues' || r.n === 'project-issues') {
      const rows = $$('#issue-table tbody tr');
      if (['j', 'k', 'ArrowDown', 'ArrowUp'].includes(e.key) && rows.length) {
        e.preventDefault();
        S.kb = Math.max(0, Math.min(rows.length - 1, S.kb + (e.key === 'j' || e.key === 'ArrowDown' ? 1 : -1)));
        rows.forEach((row, n) => { row.style.outline = n === S.kb ? '2px solid var(--accent)' : ''; row.style.outlineOffset = '-2px'; });
        rows[S.kb].scrollIntoView({ block: 'nearest' });
        return;
      }
      if (e.key === 'Enter' && S.kb >= 0 && rows[S.kb]) { nav(rows[S.kb].dataset.go); return; }
    }
    if (e.key === 'c' && !mod) { e.preventDefault(); A.newIssue(); }
  });

  // ------------------------------------------------- driven by the case study --

  const ACTIONS = {
    palette: () => { A.palette(); if (S.palette) { S.palette.q = ''; } },
    paletteSearch: (q) => { A.palette(); S.palette.q = q; $('#pal-in').value = q; renderPaletteResults(); },
    notifications: () => { S.notif = true; renderLayer(); },
    newIssue: () => A.newIssue(),
    publish: () => A.publish(),
    history: () => { S.side = 'history'; render(); },
    comments: () => { S.side = 'comments'; render(); },
    filter: (field) => { const el = $(`.fbtn[data-field="${field}"]`); if (el) A.filter(el); },
    member: (id) => { const el = $(`[data-act="memberMenu"][data-id="${id}"]`); if (el) A.memberMenu(el); },
    theme: (t) => { S.theme = t; render(); report(); },
    tokens: () => A.newToken(),
  };

  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.type !== 'kova:goto') return;
    S.signedIn = true;
    if (m.theme) S.theme = m.theme;
    if (m.path) {
      S.side = m.side ?? (m.path.startsWith('/docs/') ? S.side : null);
      nav(m.path);
    } else { render(); report(); }
    if (m.action && ACTIONS[m.action]) setTimeout(() => ACTIONS[m.action](m.arg), 160);
  });

  // ------------------------------------------------------------------ boot --

  if (!EMBEDDED) document.body.classList.add('standalone');
  const start = location.hash.slice(1);
  if (start.startsWith('/')) { S.signedIn = true; S.path = start; }
  else if (!EMBEDDED) S.path = '/sign-in';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches && !EMBEDDED) S.theme = 'dark';
  render();
  report();
  if (EMBEDDED) parent.postMessage({ type: 'kova:ready' }, '*');
})();
