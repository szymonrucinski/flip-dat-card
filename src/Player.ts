import { makeObservable, observable, action } from 'mobx';
import { Card } from './Card';

export class Player {
  score: number = 0;
  deck: Card[] = [];

  constructor() {
    makeObservable(this, {
      score: observable,
      deck: observable,
      nextCardGreater: action,
      getCardFromDeck: action
    });
  }

  nextCardGreater(cardToCheck: Card, statement: 'greater' | 'smaller'): boolean {
    const nextCard = this.deck[0];

    if (statement === 'greater') {
      if (nextCard.value > cardToCheck.value) {
        this.score++;
        return true;
      }
    } else {
      if (nextCard.value < cardToCheck.value) {
        this.score++;
        return true;
      }
    }
    return false;
  }

  getCardFromDeck(): Card | undefined {
    return this.deck.shift();
  }
}
