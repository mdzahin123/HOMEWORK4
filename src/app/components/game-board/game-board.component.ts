import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule
} from '@angular/cdk/drag-drop';
import { CardComponent } from '../card/card.component';
import { GameService } from '../../Services/game.service';
import { Card } from '../../models/card.model';
import { GameState } from '../../models/game.model';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CardComponent, CommonModule, DragDropModule],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css'
})
export class GameBoardComponent implements OnInit {
  gameState!: GameState;
  gameWon = false;
  connectedLists: string[] = [];
  isDragging = false;

  // Cached arrays of cards-from-this-index per column.
  // Without caching, each call returns a NEW array, breaking CDK's drop event payload.
  private dragGroupsCache: Card[][][] = [];

  // Same problem applies to the top waste card — cache its drag payload as a stable single-element array.
  wasteDragData: Card[] = [];

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.startNewGame();
    this.gameService.gameState$.subscribe(state => {
      this.gameState = state;
      this.rebuildDragGroups();
      this.rebuildWasteDragData();
      this.checkWin();
      this.updateConnectedLists();
    });
  }

  startNewGame(): void {
    this.gameService.startNewGame();
    this.gameWon = false;
  }

  // ---- caching helpers ----

  /**
   * After every state update, rebuild the array of "drag groups" for each column.
   * dragGroupsCache[col][i] = the array of cards starting from index i in that column.
   * Stored once per state change so CDK has stable references during a drag.
   */
  private rebuildDragGroups(): void {
    this.dragGroupsCache = this.gameState.columns.map(column =>
      column.map((_, i) => column.slice(i))
    );
  }

  private rebuildWasteDragData(): void {
    const top = this.gameState.waste[this.gameState.waste.length - 1];
    this.wasteDragData = top ? [top] : [];
  }

  cardsFrom(columnIndex: number, cardIndex: number): Card[] {
    return this.dragGroupsCache[columnIndex]?.[cardIndex] ?? [];
  }

  // ---- list connections ----

  updateConnectedLists(): void {
    this.connectedLists = [
      ...Array.from({ length: 7 }, (_, i) => `column-${i}`),
      'foundation-hearts',
      'foundation-diamonds',
      'foundation-clubs',
      'foundation-spades',
      'waste-pile'
    ];
  }

  checkWin(): void {
    this.gameWon = this.gameService.checkWin();
  }

  // ---- foundation helpers ----

  getFoundationPile(suit: string): Card[] {
    return this.gameState.foundationPiles[suit as 'hearts' | 'diamonds' | 'clubs' | 'spades'] || [];
  }

  getFoundationCardForSuit(suit: string): Card | null {
    const pile = this.getFoundationPile(suit);
    return pile.length > 0 ? pile[pile.length - 1] : null;
  }

  // ---- click / double-click handlers ----

  onCardClick(columnIndex: number): void {
    this.gameService.flipCard(columnIndex);
  }

  onCardDoubleClick(card: Card, columnIndex: number): void {
    if (!card.faceUp) return;
    const column = this.gameState.columns[columnIndex];
    if (column[column.length - 1].id === card.id) {
      this.gameService.moveToFoundation(card, 'column', columnIndex);
    }
  }

  onWasteCardDoubleClick(card: Card): void {
    const top = this.gameState.waste[this.gameState.waste.length - 1];
    if (top && card.id === top.id) {
      this.gameService.moveToFoundation(card, 'waste');
    }
  }

  onDrawCard(): void {
    this.gameService.drawCard();
  }

  // ---- drag lifecycle ----

  draggingColumn: number | null = null;
  draggingFromIndex: number | null = null;

  onDragStarted(columnIndex?: number, cardIndex?: number): void {
    this.isDragging = true;
    this.draggingColumn = columnIndex ?? null;
    this.draggingFromIndex = cardIndex ?? null;
  }

  onDragEnded(): void {
    this.isDragging = false;
    this.draggingColumn = null;
    this.draggingFromIndex = null;
    // No manual reset needed: card-stack elements use natural flow layout
    // (position: relative + negative top margin), so CDK's built-in snap-back
    // returns the card to its correct stacked position automatically — both
    // after a rejected drop and after a drop on a connected list that game
    // rules disallow.
  }

  isCardBeingDragged(columnIndex: number, cardIndex: number): boolean {
    return (
      this.draggingColumn === columnIndex &&
      this.draggingFromIndex !== null &&
      cardIndex >= this.draggingFromIndex
    );
  }

  // ---- drop handler ----

  onDrop(event: CdkDragDrop<Card[]>): void {
    if (event.previousContainer === event.container) return;

    const sourceId = event.previousContainer.id;
    const targetId = event.container.id;
    const draggedCards = (event.item.data ?? []) as Card[];

    if (!draggedCards.length) return;

    // Waste -> Column
    if (sourceId === 'waste-pile' && targetId.startsWith('column-')) {
      this.gameService.moveWasteToColumn(parseInt(targetId.split('-')[1], 10));
      return;
    }

    // Waste -> Foundation
    if (sourceId === 'waste-pile' && targetId.startsWith('foundation-')) {
      const top = this.gameState.waste[this.gameState.waste.length - 1];
      const suit = targetId.split('-')[1] as 'hearts' | 'diamonds' | 'clubs' | 'spades';
      if (top && top.suit === suit) {
        this.gameService.moveToFoundation(top, 'waste');
      }
      return;
    }

    // Column -> Column
    if (sourceId.startsWith('column-') && targetId.startsWith('column-')) {
      const src = parseInt(sourceId.split('-')[1], 10);
      const tgt = parseInt(targetId.split('-')[1], 10);
      if (src !== tgt) {
        this.gameService.moveCards(draggedCards, src, tgt);
      }
      return;
    }

    // Column -> Foundation (only single card)
    if (sourceId.startsWith('column-') && targetId.startsWith('foundation-')) {
      if (draggedCards.length === 1) {
        const src = parseInt(sourceId.split('-')[1], 10);
        const suit = targetId.split('-')[1] as 'hearts' | 'diamonds' | 'clubs' | 'spades';
        if (draggedCards[0].suit === suit) {
          this.gameService.moveToFoundation(draggedCards[0], 'column', src);
        }
      }
      return;
    }
  }

  /** Used for *ngFor over column indices */
  columnIndices = [0, 1, 2, 3, 4, 5, 6];
  suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];

  suitSymbol(suit: string): string {
    return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit] ?? '';
  }
}
