# AI Collaboration Reflection (CMPE 285)

> **Note:** This reflection is also included in the main [`README.md`](./README.md#ai-usage-write-up) for submission.

## What the AI wrote end-to-end

- Project scaffolding (folder layout, `package.json` files, Vite proxy config)
- Bulk movie seed generator (`generate-movies.js`) and `movies.json` catalog
- Express route handlers, SQLite schema, and vote deduplication via `UNIQUE(item_id, session_id)`
- React components: swipe deck, movie card, results/matches views, and mobile CSS
- Initial README and API documentation outline

## Where I had to fix or rewrite (concrete example)

The assistant sometimes generated invalid JSX (mistyped HTML element tags), which broke the build. I fixed this with a search-and-replace across `*.jsx` before testing. I also corrected `SwipeDeck` pointer handlers so touch and mouse events were not fired twice on the same gesture, and verified that poster images and descriptions were visible after changing the card layout to a bottom gradient overlay.

## What the AI did better or worse than expected

**Better:** A full vertical slice (seed data → API → swipe UI → results) came together quickly, including stretch features like undo, matches, and analytics.

**Worse:** First-pass image URLs (placehold.co) and card layout hid movie descriptions; I had to steer a second iteration toward reliable images (picsum.photos) and overlay typography. Rubric items (100+ items, dedup, pull-down to results) needed manual verification rather than assuming completeness.

## Other AI tools used

- **Cursor (Claude)** — primary pair-programming assistant for design, implementation, and debugging
- No other AI tools were used for code generation

## How I directed the AI

I provided the assignment screenshots, chose the **Movie Matchups** theme, and requested end-to-end delivery with stretch goals. I rejected `localStorage` as the vote source of truth, insisted on real backend persistence, and reviewed deduplication and API shape before accepting the architecture.
