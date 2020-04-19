export class Card
{
    color : string;
    suite : string;
    rank : string;
    value : Number;
    wasPlayed: boolean = false;
    constructor(Color:string, Suite:string,Rank:string, Value:Number){
        this.color = Color;
        this.suite = Suite;
        this.rank = Rank;
        this.value = Value;
    }

    id() : string
    {
        return this.color +'_'+this.rank + '_' + this.suite + '_' + this.value;
    }

    getImg() : string
    {
        return './images/'+this.rank+'_of_'+this.suite+'.png';
    }

    getBackImg() : string

    {
        return './images/'+'card_back_'+this.color+'.png';
    }


} 