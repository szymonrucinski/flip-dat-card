export class Card {
  color: string;
  suite: string;
  rank: string;
  value: number;

  constructor(color: string, suite: string, rank: string, value: number) {
    this.color = color;
    this.suite = suite;
    this.rank = rank;
    this.value = value;
  }

  id(): string {
    return `${this.rank}_of_${this.suite}`;
  }

  getImg(): string {
    return `./images/${this.id()}.png`;
  }

  getBackImg(): string {
    return `./images/card_back_${this.color}.png`;
  }
}
