import {CardGenerator} from './CardGenerator';
import {Card} from './Card'

export class Player
{
  score: number;
  deck: Card[];

  constructor()
  {
      let cg = new CardGenerator();
      this.score =0;
      this.deck = cg.shuffle();
  }
 
addPoint(){
     this.score++ ;
}


nextCardGreater(cardToCheck:Card, statement:boolean)
{
    let size =this.deck.length;

    if(this.deck[size-1].value > cardToCheck.value && statement){
        this.score++;}
    
    else if(this.deck[size-1].value < cardToCheck.value && statement==false)
        this.score++; 

    console.log('current'+this.deck[size-1].value);
    // console.log('previous'+cardToCheck.value);
    console.log('incoming'+this.deck[size-3].value)

    
    
}

pop()
{

}




}

