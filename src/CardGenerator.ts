import { Card } from './Card';

export class CardGenerator {
  generateCards(): Card[] {
    const cards: Card[] = [];
    const redSuites = ['hearts', 'diamonds'];
    const blackSuites = ['clubs', 'spades'];
    const ranks = [
      { rank: 'ace', value: 1 },
      { rank: '2', value: 2 },
      { rank: '3', value: 3 },
      { rank: '4', value: 4 },
      { rank: '5', value: 5 },
      { rank: '6', value: 6 },
      { rank: '7', value: 7 },
      { rank: '8', value: 8 },
      { rank: '9', value: 9 },
      { rank: '10', value: 10 },
      { rank: 'jack', value: 11 },
      { rank: 'queen', value: 11 },
      { rank: 'king', value: 11 }
    ];

    // Generate red cards
    redSuites.forEach(suite => {
      ranks.forEach(({ rank, value }) => {
        cards.push(new Card('red', suite, rank, value));
      });
    });

    // Generate black cards
    blackSuites.forEach(suite => {
      ranks.forEach(({ rank, value }) => {
        cards.push(new Card('black', suite, rank, value));
      });
    });

    return this.shuffle(cards);
  }

  shuffle(cards: Card[]): Card[] {
    const deck = [...cards];
    for (let i = 0; i < 1000; i++) {
      const randomIndex1 = Math.floor(Math.random() * deck.length);
      const randomIndex2 = Math.floor(Math.random() * deck.length);
      [deck[randomIndex1], deck[randomIndex2]] = [deck[randomIndex2], deck[randomIndex1]];
    }
    return deck;
  }
}
