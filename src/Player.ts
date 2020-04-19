import {CardGenerator} from './CardGenerator'
import {Card} from './Card'
import {autorun, observable, computed,action} from 'mobx'

 export class Player
{
  @observable score: number;
  @observable deck: Card[];

  constructor()
  {
      let cg = new CardGenerator();
      this.score =0;
      this.deck = cg.shuffle();
  }
 



@action nextCardGreater(cardToCheck:Card, statement:boolean)
{
    let size =this.deck.length;

    if(this.deck[size-2].value > cardToCheck.value && statement){
        this.score++;}
    
    else if(this.deck[size-2].value < cardToCheck.value && statement==false)
        this.score++; 

  
    
    
}

@action getCardFromDeck()
{
   return this.deck.pop();
}



}


const player = new Player();

autorun(()=>{
    console.log(player.deck[player.deck.length-1]);
})

export default player;
