# Solitaire (Angular)

A simple Klondike Solitaire game built with [Angular 19](https://angular.dev/) and the Angular CDK drag-and-drop module.

This is a pure client-side app — no backend, no API keys, no accounts. Just open it and play.

---

## Features

- **Classic Klondike rules** — 7 tableau columns, 4 foundations, stock and waste pile.
- **Drag-and-drop** for moving cards between columns, to foundations, and from the waste.
- **Move single cards or stacks** of cards (as long as the stack is a valid sequence).
- **Double-click a card** to send it to its foundation pile automatically.
- **Auto-flip** the top tableau card whenever the card on top of it moves away.
- **Stock recycle** — when the stock empties, click again to flip the waste back over.
- **Win detection** with a banner and a one-click "New Game" reset.
- **Responsive layout** — cards shrink on narrow screens.

---

## Project Structure

```
Solitaire/
├── package.json
├── angular.json
├── tsconfig*.json
├── public/
│   └── favicon.ico
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css
    └── app/
        ├── app.component.{ts,html,css}
        ├── app.config.ts
        ├── app.routes.ts
        ├── Services/
        │   └── game.service.ts          # Game state + move validation (BehaviorSubject)
        ├── models/
        │   ├── card.model.ts
        │   └── game.model.ts
        └── components/
            ├── card/                    # Single card UI
            ├── game-board/              # The play area + drag/drop wiring
            ├── home/                    # Landing page
            └── rules/                   # How-to-play page
```

---

## Running Locally

You'll need Node.js (v18 or newer) and npm.

```bash
# install dependencies
npm install

# start the dev server
npm start
```

Then open [http://localhost:4200](http://localhost:4200) in your browser. The app will auto-reload when you save changes.

To build a production bundle:

```bash
npm run build
```

The output will be in `dist/`.

---

## How to Play

1. Click **Play** in the navigation bar.
2. Click the **Stock** pile (top-left) to flip cards to the **Waste**.
3. Drag cards around:
   - Tableau column → another tableau column (descending, alternating colors)
   - Tableau column → foundation (same suit, ascending)
   - Waste → tableau or foundation
4. **Double-click** any top card to auto-send it to its foundation if it fits.
5. An empty tableau column can only be filled with a King.
6. Win when all four foundations hold A → K of their suit.

See the [Rules page](#) inside the app for a more thorough breakdown.

---

## Architecture Notes

### State management
Game state lives in `GameService` as a `BehaviorSubject<GameState>`. Every move produces an immutable new state and `next()`s it through the subject. Components subscribe via the async pipe / lifecycle and re-render.

### Drag and drop
This app uses Angular CDK's `cdkDropList` / `cdkDrag` directives. A few things to be aware of if you fork the code:

- **Stable drag-data references.** Each tableau card needs its drag payload (the array of cards it brings with it) to keep referential equality across change-detection cycles. The `game-board` component caches these arrays in `dragGroupsCache` and rebuilds the cache whenever game state changes — never inside a getter.
- **No transforms on `.cdk-drag-preview`.** Scaling or rotating the drag preview throws off CDK's pointer-offset math and causes drops to register on the wrong column. The preview is left at its natural size.
- **Fixed-height columns.** Each tableau column has `min-height: 500px` so the drop list always has a stable bounding box, even when empty.
- **Empty-column placeholder fills the column.** The "drop a King here" placeholder sits at the top of the column, but the column itself is the drop target — so a King dropped *anywhere* in that column lane works.
- **All drop lists are connected to all others.** The `connectedLists` array in `game-board.component.ts` lists every column, every foundation, and the waste pile, so any pile can accept a drag from any other.

### What's not here

- No undo/redo (kept simple).
- No animation when cards auto-fly to foundations.
- No timer or scoring (the rules page mentions optional scoring, but it's not wired up).
- No persistence — refreshing the page starts a new deal.

These would be reasonable next-step features.

---

## Tech Stack

- **[Angular 19](https://angular.dev/)** with standalone components.
- **[Angular CDK Drag & Drop](https://material.angular.io/cdk/drag-drop/overview)** for card movement.
- **RxJS** `BehaviorSubject` for state.
- **TypeScript 5.7** with strict mode (Angular default).

No external services, no API keys, no analytics, no telemetry. The whole app runs offline once it's built.

---

## License

This project was built as a CMPSC 421 course project. Use it as a learning reference, fork it, modify it — no warranty, no restrictions on the code itself.
