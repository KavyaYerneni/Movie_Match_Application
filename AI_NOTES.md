# AI Collaboration Reflection (CMPE 285)

## What the AI wrote end-to-end

- Initial project scaffolding (folder layout, `package.json` files, Vite proxy config)
- Bulk movie seed list generator (`generate-movies.js`) and 124-item `movies.json`
- Express route handlers, SQLite schema, deduplication via unique constraint
- React components: swipe deck, movie card, results/matches views, CSS for mobile layout
- README structure and API documentation outline

## Where I had to fix or rewrite (concrete example)

The assistant repeatedly emitted `<motion>` instead of `<div>` in JSX (likely a bad autocomplete pattern). I fixed this with a small Python replace across `*.jsx` before testing. I also corrected SwipeDeck pointer handlers so touch and mouse events were not double-fired on the same gesture.

## Better / worse than expected

**Better:** Fast vertical slice — backend seed + three endpoints + working proxy in under an hour.  
**Worse:** Needed manual verification of rubric line items (pull-down gesture, 100+ count, idempotent votes) rather than assuming the first pass was complete.

## Other tools

- **Cursor (Claude)** — primary pair programmer for this submission  
- No other AI tools used for code generation

## How I directed the AI

I provided the assignment screenshots, insisted on the **movie matching** theme, and asked for end-to-end delivery including stretch goals. I reviewed deduplication and “server as source of truth” before accepting the design.
