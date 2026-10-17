# Kova — Case Study & Interactive Prototype

> **Read-only Mirror.** This is maintained in Xkye Solutions' private monorepo and split here with its history. Changes made here are overwritten, so please don't open issues or pull requests. Live at <https://kova.xkye.app>. Built on [`case-study-kit`](https://github.com/xkye-solutions/case-study-kit) and [`brand`](https://github.com/xkye-solutions/brand), which are Mirrors too.

A portfolio case study by **Xkye Solutions** for Kova, the studio's own project, issue and knowledge tool. The page tells the product story and embeds a live, clickable prototype of the Kova web app that follows along as you scroll.

Built with Astro on the shared case-study kit (`@xkye/case-study-kit`) as a `desktop` Story; see the kit's README for how the pieces fit.

## Running locally

From the monorepo root:

```sh
pnpm install
pnpm --filter @xkye/kova-case-study dev
```

Then open the URL Astro prints: `/` is the case study, `/prototype.html` is the prototype on its own (it starts at sign-in), and `/prototype.html#/projects/ACM/board` deep-links any prototype address. `pnpm build` writes the site to `dist/`.

## Project structure

```
.
├── astro.config.mjs
├── src/
│   ├── pages/index.astro       The case study: nav, hero, narrative chapters, the terminal and end sections
│   ├── content/flows/          One MDX file per key-flow chapter
│   ├── content.config.ts       The flows collection, on the kit's flowSchema
│   └── styles/kova.css         All page styles
└── public/
    ├── prototype.html          Prototype shell and styles (the app's real design tokens), served as-is
    └── assets/
        ├── brand/              Kova and Kova Docs marks and favicons, from the monorepo's brand kit
        ├── kova-board.png      The hero shot
        └── js/prototype.js     Prototype state, router, views and actions
```

## Prototype

One in-memory state, a path router and an action map (`A`) wired to `data-act` attributes; navigation uses `data-go="/path"`. Everything resets on reload.

The address is the source of truth, as it is in Kova: a Filter lives entirely in the query string, so a narrowed list is a link. Standalone, the path is kept in the URL hash.

**Data** mirrors the monorepo's sample seed (`supabase/seeds`): the five people (two Owners, a member, an invited and a suspended person), the Projects (renamed to fictional ones), and the sample issues with their seeded titles, statuses and priorities.

**Flows:** sign-in; Areas strip (Kova, Kova Docs, Admin) with per-Area memory; Home and My Work; notifications popover; Filters by Status, Priority, Assignee, Project and Placement, with Saved filters and `j`/`k` keyboard navigation; issue detail with editable properties and comments; drag-and-drop board; Sprint planning with estimates; ⌘K command palette; new issue (`c`); Kova Docs with Drafts, collaborators, Publish, a live issue-list Embed, a self-updating table of contents, the `/` block menu, anchored comment Threads with Resolve, Version history and named versions, Icon and Cover pickers, Archive (read-only, restorable) and a Trash that purges after 30 days; Admin's Needs attention, the People roster, Suspend (which unassigns unfinished issues), and the Confirmation code that guards ownership changes and Remove from Kova for five minutes; personal access tokens; light and dark themes.

### Driving it from the case study

The case study sends `kova:goto` messages to the embedded prototype as each chapter becomes active, following the kit's Prototype contract:

```js
frame.contentWindow.postMessage({
  type: 'kova:goto',
  path: '/issues?status=blocked&assignee=me', // any prototype address
  view: 'comments',      // optional: 'comments' | 'history' panel on a Document
  action: 'filter',      // optional: palette | paletteSearch | notifications | newIssue | collapse |
                         //   publish | history | comments | docMenu | filter | member | theme | tokens
  data: 'priority',      // optional argument for the action
  theme: 'dark',         // optional
}, '*');
```

Each chapter declares its target with a `goto` prop (or `goto` frontmatter for a key flow), so adding a chapter only needs markup or a new file in `src/content/flows/`. The prototype reports back with `{ type: 'kova:status', url, theme, href }` after every navigation, which drives the title bar above the window (address, theme toggle and full-screen link), and `{ type: 'kova:ready' }` once it has loaded.

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

This Case Study lives in the `xkye-solutions` monorepo. `pnpm build` builds it into `dist/`, which Alchemy deploys to Cloudflare at `kova.xkye.app`. Its source is split, with history, to the read-only `xkye-solutions/kova-case-study` Mirror.
