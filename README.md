# Kova — Case Study & Interactive Prototype

A portfolio case study by **Xkye Solutions** for Kova, the studio's own project, issue and knowledge tool. The page tells the product story and embeds a live, clickable prototype of the Kova web app that follows along as you scroll.

- `index.html` — the case study
- `prototype.html` + `assets/js/prototype.js` — the interactive desktop app, also usable on its own

No build step, framework or dependencies: plain HTML, CSS and JavaScript.

## Running locally

Serve the folder over HTTP (the case study talks to the prototype through an `<iframe>`, which browsers block on `file://`):

```sh
python3 -m http.server 4188 --bind 127.0.0.1
```

Then open:

- http://127.0.0.1:4188/ — case study
- http://127.0.0.1:4188/prototype.html — prototype on its own (starts at sign-in)
- http://127.0.0.1:4188/prototype.html#/projects/DAL/board — any prototype address, deep-linked

## Project structure

```
.
├── index.html               Case study page
├── prototype.html           Prototype shell and styles (the app's real design tokens)
├── assets/
│   ├── brand/               Kova and Kova Docs marks and favicons, from the monorepo's brand kit
│   └── js/prototype.js      Prototype state, router, views and actions
└── .github/workflows/
    └── deploy.yml           GitHub Pages deployment
```

## Prototype

One in-memory state, a path router and an action map (`A`) wired to `data-act` attributes; navigation uses `data-go="/path"`. Everything resets on reload.

The address is the source of truth, as it is in Kova: a Filter lives entirely in the query string, so a narrowed list is a link. Standalone, the path is kept in the URL hash.

**Data** mirrors the monorepo's sample seed (`supabase/seeds`): the five people (two Owners, a member, an invited and a suspended person), the Projects, and the Dalqen issues with their seeded titles, statuses and priorities.

**Flows:** sign-in; Areas strip (Kova, Kova Docs, Admin) with per-Area memory; Home and My Work; notifications popover; Filters by Status, Priority, Assignee, Project and Placement, with Saved filters and `j`/`k` keyboard navigation; issue detail with editable properties and comments; drag-and-drop board; Sprint planning with estimates; ⌘K command palette; new issue (`c`); Kova Docs with Drafts, collaborators, Publish, a live issue-list Embed, a self-updating table of contents, the `/` block menu, anchored comment Threads with Resolve, Version history and named versions, Icon and Cover pickers, Archive and Trash; Admin's Needs attention, the People roster, Suspend (which unassigns unfinished issues), and the Confirmation code that guards ownership changes and Remove from Kova for five minutes; personal access tokens; light and dark themes.

### Driving it from the case study

`index.html` sends a message to the embedded prototype as each chapter scrolls into view:

```js
frame.contentWindow.postMessage({
  type: 'kova:goto',
  path: '/issues?status=blocked&assignee=me', // any prototype address
  side: 'comments',      // optional: 'comments' | 'history' panel on a Document
  action: 'filter',      // optional: palette | paletteSearch | notifications | newIssue |
                         //   publish | history | comments | filter | member | theme | tokens
  arg: 'priority',       // optional argument for the action
  theme: 'dark',         // optional
}, '*');
```

Chapters declare their target with a `data-goto` attribute, so adding a chapter only needs markup. The prototype reports back with `{ type: 'kova:url', path, theme }` after every navigation, which drives the address bar above the window, and `{ type: 'kova:ready' }` once it has loaded.

## Brand

Colours, type and logos follow the Kova brand kit (`brand/kova` in the monorepo):

| Token | Hex | Role |
| --- | --- | --- |
| Kova Navy | `#06142D` | Ink, dark bands, wordmark |
| Deep Blue | `#032EA4` | Pressed states, depth |
| Action Blue | `#0449D4` | Actions and links |
| Electric Blue | `#0497F8` | Dark-theme accent |
| Sky Cyan | `#52DDFC` | Highlights on navy |
| Paper | `#F5F8FF` | Page background |

- **Typefaces:** [Outfit](https://fonts.google.com/specimen/Outfit) for the case study's headings, [Inter](https://rsms.me/inter/) for body and the product, [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for issue keys, dates and the CLI. All loaded from Google Fonts.
- **Icons:** [Tabler Icons](https://tabler.io/icons) webfont 3.31.0, the same family the app uses.
- **App tokens:** the prototype's light and dark values are copied from `apps/web/src/styles/app.css` (KOV-045).
- **Logo:** always use the supplied SVGs in `assets/brand/`; never typeset the wordmark.

## Deploying

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. To serve it on a custom domain, add a `CNAME` file at the root; the workflow copies it when present.
