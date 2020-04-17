import  {Card} from './Card';

let Suite =  ["hearts", "diamonds", "clubs", "spades"]
let Rank = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"]
let Value =[1,2,3,4,5,6,7,8,9,10,11,11,11]


export class CardGenerator 
{


     private generateCards() {

        var deck: Card[] = [];
        var colorCounter = 0;
        var suiteCounter =0;
        var rankCounter =0;
        var color;


        for (suiteCounter = 0; suiteCounter <= Suite.length-1; suiteCounter++) 
        {
            if(Suite[suiteCounter]=='hearts' || Suite[suiteCounter]=='diamonds') color ="Red"
            else color = "Black"

            for(rankCounter =0; rankCounter <=Rank.length-1; rankCounter++)
            {
                deck.push(new Card(color, Suite[suiteCounter],Rank[rankCounter],Value[rankCounter]))
            }
        }

        return deck;
   
    }

    public shuffle()
{
     let deck: Card[] = this.generateCards();

	// for 1000 turns
	// switch the values of two random cards
	for (var i = 0; i < 1000; i++)
	{
		var location1 = Math.floor((Math.random() * deck.length));
		var location2 = Math.floor((Math.random() * deck.length));
		var tmp = deck[location1];

		deck[location1] = deck[location2];
        deck[location2] = tmp;
        
    }

    for(var index in deck) 
    {  
        console.log(index+deck[index].id());  
    } 

    return deck;
    
}

} 