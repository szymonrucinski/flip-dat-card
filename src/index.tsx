import React, { useState,useLayoutEffect,useEffect } from 'react';
import ReactDOM, { render } from 'react-dom';
import { Player } from './Player';
import styledComponents from 'styled-components'
import { createGlobalStyle } from 'styled-components'
import UIfx from 'UIfx';
import ReactCardFlip from 'react-card-flip'
import {CardFlip} from './CardFlip'




const BackgroundLayer = createGlobalStyle`
@font-face {
    font-family: CARDC___;
    src: url(./fonts/CARDC___.ttf) format('truetype'),
  
}
body{
    background: green;
    font-family: Card Characters;
}

`;

const CardStyle = styledComponents.img`
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 30%;  
`;

const DisplayScore = styledComponents.h1`
text-align:center;
color: white;
`;

const ButtonWrapper = styledComponents.div`
margin-top: 50px;
text-align: center;
display: inline-block;
position: absolute;
width:100%;
`;

const ActionButtons = styledComponents.button`
font-size: 20px;
text-align: center; 
background:red;
border-radius:15px;
outline-color:none;
margin-left: 15px;
margin-right: 15px;
font-family: Card Characters;
color:white;



`;
let plr = new Player();
let state = true;




const App = () => {

    const [currentCard, setCard] = useState(() => {
        const card = plr.deck.pop();
        return card;
      });

    const [score, setScore] = useState(plr.score);


    const Pop = () => {
        return <>
          <BackgroundLayer/>
          <span>
            <DisplayScore>{score}</DisplayScore>
            </span>
            <CardFlip cardImg={currentCard.getImg()} flipper={plr.deck[(plr.deck.length)-1].getImg()}>
            </CardFlip>
            {/* <CardStyle src={currentCard.getImg()}/> */}
            <ButtonWrapper>
            <ActionButtons onClick={(e) => {
                plr.nextCardGreater(currentCard,true);
                                setScore(plr.score);
                setCard(plr.deck.pop());

            }}>Next is greater!</ActionButtons>

            <ActionButtons onClick={(e) => {
                plr.nextCardGreater(currentCard,false);
                setScore(plr.score);
                setCard(plr.deck.pop());                
                render;

            }}>Next is smaller!</ActionButtons>
            </ButtonWrapper>






        </>

    }

    return (<Pop/>)

}

ReactDOM.render(<App />, document.getElementById('root'))

