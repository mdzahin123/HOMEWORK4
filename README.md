# Solitaire

A classic Klondike Solitaire game built with **Angular 19** and the **Angular CDK** drag-and-drop module. Pure client-side — no backend, no accounts, no telemetry. Open it and play.

![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- Standard Klondike rules — 7 tableau columns, 4 foundations, stock and waste.
- Drag-and-drop between columns, to foundations, and from the waste pile.
- Move single cards or valid sequences of cards as a stack.
- Double-click any face-up top card to auto-send it to its foundation.
- Auto-flip the newly exposed card when you move one off the top of a column.
- Stock recycle — when the stock empties, click the empty slot to flip the waste back over.
- Win detection with a banner and one-click "New Game".
- Responsive layout — cards shrink on narrow screens.

## Quick start

You need **Node.js 18+** and **npm**.

```bash
git clone https://github.com/<your-username>/solitaire.git
cd solitaire
npm install
npm start
```

Then open [http://localhost:4200](http://localhost:4200). The dev server hot-reloads on save.

To build a production bundle:

```bash
npm run build
```

Output lands in `dist/game/`.

## How to play

1. Click **Play** in the top nav.
2. Click the **Stock** (top-left, face-down deck) to flip a card to the **Waste**.
3. Drag cards around the board:
   - **Tableau → tableau**: descending value, alternating colors (red on black, black on red).
   - **Tableau or waste → foundation**: same suit, ascending from Ace to King.
   - **Empty tableau column**: only a King (or a stack starting with a King) can fill it.
4. **Double-click** any playable top card to auto-send it to its foundation.
5. Win when all four foundations are full — A through K of each suit.

The in-app **Rules** page has a fuller breakdown.

## Project structure

```
solitaire/
├── angular.json
├── package.json
├── tsconfig*.json
├── public/
│   └── favicon.ico
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css
    └── app/
        ├── app.component.{ts,html,css}     # Root layout + nav bar
        ├── app.config.ts                   # App-level providers
        ├── app.routes.ts                   # Home / Play / Rules routes
        ├── Services/
        │   └── game.service.ts             # Game state + move validation
        ├── models/
        │   ├── card.model.ts
        │   └── game.model.ts
        └── components/
            ├── card/                       # Single-card UI
            ├── game-board/                 # Play area + drag/drop wiring
            ├── home/                       # Landing page
            └── rules/                      # How-to-play page
```

## Architecture notes

### State management

Game state lives in `GameService` as a `BehaviorSubject<GameState>`. Every move builds a new immutable state and pushes it through the subject. The board component subscribes once in `ngOnInit` and rebuilds its caches whenever a new state arrives.

### Drag and drop

This app uses Angular CDK's `cdkDropList` / `cdkDrag` directives. A few things worth knowing if you read or fork the code:

- **Stable drag-data references.** When you drag a card from a tableau column, the payload is the array of cards that come with it (everything from that card down). These arrays are precomputed into a `dragGroupsCache` after every state change rather than rebuilt in a getter — otherwise CDK sees a new reference on every change-detection cycle and the drop event ends up with an empty payload.

- **Natural-flow stacking for tableau cards.** Each card in a column uses `position: relative` with a negative `margin-top`, so the cards overlap in normal document flow. This is **deliberate**: CDK's snap-back animation only returns elements correctly when they are in normal flow. An earlier version used `position: absolute` with a computed `top` per card, which caused rejected drops to snap to `top: 0` of the column. The flow-layout approach lets CDK return cards to their actual stacked positions for free, with no manual `reset()` calls.

- **Custom drag preview.** A dragged stack shows every card it carries, not just the top one. The preview uses absolute positioning *inside the preview clone* (the clone lives outside the drop list, so the flow-layout rule above doesn't apply to it).

- **All drop lists are connected.** Every column, every foundation, and the waste pile are listed in `connectedLists`, so any pile can accept a drag from any other. Game rules (in `GameService.canMoveToColumn` and `moveToFoundation`) decide whether a given drop is legal — invalid drops are silently rejected and the card animates back.

- **Empty-column placeholder fills the column.** The "drop a King here" placeholder is just a visual hint; the entire column is the drop target, so dropping a King anywhere in that lane works.

### What's not here

- No undo/redo.
- No persistence — refreshing the page deals a fresh game.
- No timer or scoring.
- No animation when foundations auto-collect cards.

These are reasonable next-step features if you want to extend it.

## Tech stack

- [Angular 19](https://angular.dev/) with standalone components
- [Angular CDK Drag & Drop](https://material.angular.io/cdk/drag-drop/overview)
- RxJS `BehaviorSubject` for state
- TypeScript 5.7 with strict mode

No external services, no API keys, no analytics. The whole app runs offline once built.

## License

MIT — feel free to use, fork, and modify. No warranty.
