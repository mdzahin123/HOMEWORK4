import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Card } from '../models/card.model';
import { GameState } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private gameStateSubject = new BehaviorSubject<GameState>(this.getInitialState());
  gameState$ = this.gameStateSubject.asObservable();

  startNewGame(): void {
    this.gameStateSubject.next(this.getInitialState());
  }

  private getInitialState(): GameState {
    const deck = this.createShuffledDeck();
    const columns: Card[][] = [];

    for (let i = 0; i < 7; i++) {
      const column: Card[] = [];
      for (let j = 0; j <= i; j++) {
        const card = deck.pop();
        if (card) {
          card.faceUp = j === i;
          column.push(card);
        }
      }
      columns.push(column);
    }

    const stock = deck.map(card => ({ ...card, faceUp: false }));

    return {
      columns,
      foundationPiles: { hearts: [], diamonds: [], clubs: [], spades: [] },
      stock,
      waste: []
    };
  }

  private createShuffledDeck(): Card[] {
    const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] =
      ['hearts', 'diamonds', 'clubs', 'spades'];
    const deck: Card[] = [];

    suits.forEach(suit => {
      const color = (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
      for (let value = 1; value <= 13; value++) {
        deck.push({ suit, value, color, faceUp: false, id: `${suit}-${value}` });
      }
    });

    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  drawCard(): void {
    const state = this.gameStateSubject.value;
    if (state.stock.length === 0) {
      // recycle waste back into stock
      if (state.waste.length > 0) {
        const newStock = [...state.waste].reverse().map(c => ({ ...c, faceUp: false }));
        this.gameStateSubject.next({ ...state, stock: newStock, waste: [] });
      }
      return;
    }

    const newStock = [...state.stock];
    const card = newStock.pop();
    if (card) {
      this.gameStateSubject.next({
        ...state,
        stock: newStock,
        waste: [...state.waste, { ...card, faceUp: true }]
      });
    }
  }

  flipCard(columnIndex: number): void {
    const state = this.gameStateSubject.value;
    if (columnIndex < 0 || columnIndex >= state.columns.length) return;
    const column = state.columns[columnIndex];
    if (column.length === 0) return;

    const lastIndex = column.length - 1;
    const last = column[lastIndex];
    if (last.faceUp) return;

    const updatedColumns = state.columns.map((col, i) =>
      i === columnIndex
        ? [...col.slice(0, lastIndex), { ...last, faceUp: true }]
        : col
    );

    this.gameStateSubject.next({ ...state, columns: updatedColumns });
  }

  moveToFoundation(card: Card, sourceType: 'column' | 'waste', columnIndex?: number): boolean {
    const state = this.gameStateSubject.value;
    const pile = state.foundationPiles[card.suit];

    const canMove =
      (pile.length === 0 && card.value === 1) ||
      (pile.length > 0 && pile[pile.length - 1].value === card.value - 1);

    if (!canMove) return false;

    const updated: GameState = {
      ...state,
      foundationPiles: {
        ...state.foundationPiles,
        [card.suit]: [...pile, card]
      },
      columns: state.columns.map(c => [...c]),
      waste: [...state.waste]
    };

    if (sourceType === 'column' && columnIndex !== undefined) {
      const col = updated.columns[columnIndex].slice(0, -1);
      // flip newly exposed top card if needed
      if (col.length > 0 && !col[col.length - 1].faceUp) {
        col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
      }
      updated.columns[columnIndex] = col;
    } else if (sourceType === 'waste') {
      updated.waste.pop();
    }

    this.gameStateSubject.next(updated);
    return true;
  }

  canMoveToColumn(card: Card, targetColumn: Card[]): boolean {
    if (targetColumn.length === 0) {
      return card.value === 13; // only Kings can fill empty columns
    }
    const top = targetColumn[targetColumn.length - 1];
    return top.faceUp && top.color !== card.color && top.value === card.value + 1;
  }

  moveCards(cards: Card[], sourceColumnIndex: number, targetColumnIndex: number): void {
    const state = this.gameStateSubject.value;

    if (
      cards.length === 0 ||
      sourceColumnIndex < 0 || sourceColumnIndex >= state.columns.length ||
      targetColumnIndex < 0 || targetColumnIndex >= state.columns.length ||
      sourceColumnIndex === targetColumnIndex
    ) return;

    const targetColumn = state.columns[targetColumnIndex];
    if (!this.canMoveToColumn(cards[0], targetColumn)) return;

    const sourceColumn = state.columns[sourceColumnIndex];
    const startIndex = sourceColumn.findIndex(c => c.id === cards[0].id);
    if (startIndex === -1) return;

    const updatedColumns = state.columns.map(col => [...col]);

    // remove from source
    updatedColumns[sourceColumnIndex] = sourceColumn.slice(0, startIndex);
    // flip new top of source if needed
    const src = updatedColumns[sourceColumnIndex];
    if (src.length > 0 && !src[src.length - 1].faceUp) {
      src[src.length - 1] = { ...src[src.length - 1], faceUp: true };
    }

    // add to target
    updatedColumns[targetColumnIndex] = [...targetColumn, ...cards];

    this.gameStateSubject.next({ ...state, columns: updatedColumns });
  }

  moveWasteToColumn(targetColumnIndex: number): void {
    const state = this.gameStateSubject.value;
    if (
      targetColumnIndex < 0 || targetColumnIndex >= state.columns.length ||
      state.waste.length === 0
    ) return;

    const card = state.waste[state.waste.length - 1];
    const targetColumn = state.columns[targetColumnIndex];
    if (!this.canMoveToColumn(card, targetColumn)) return;

    const updatedColumns = state.columns.map((col, i) =>
      i === targetColumnIndex ? [...col, card] : [...col]
    );
    this.gameStateSubject.next({
      ...state,
      waste: state.waste.slice(0, -1),
      columns: updatedColumns
    });
  }

  checkWin(): boolean {
    const state = this.gameStateSubject.value;
    return Object.values(state.foundationPiles).every(pile => pile.length === 13);
  }
}
