export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number;
  color: 'red' | 'black';
  faceUp: boolean;
  id: string;
}
