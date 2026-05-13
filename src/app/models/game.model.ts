import { Card } from './card.model';

export interface GameState {
  columns: Card[][];
  foundationPiles: {
    hearts: Card[];
    diamonds: Card[];
    clubs: Card[];
    spades: Card[];
  };
  stock: Card[];
  waste: Card[];
}
