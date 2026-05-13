import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  @Input() card!: Card;
  @Input() draggable = true;
  @Output() cardDoubleClick = new EventEmitter<Card>();

  getCardValue(): string {
    switch (this.card.value) {
      case 1:  return 'A';
      case 11: return 'J';
      case 12: return 'Q';
      case 13: return 'K';
      default: return this.card.value.toString();
    }
  }

  getSuitSymbol(): string {
    return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[this.card.suit];
  }

  onDoubleClick(): void {
    this.cardDoubleClick.emit(this.card);
  }
}
