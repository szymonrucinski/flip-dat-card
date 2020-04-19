import React, { useState,useLayoutEffect,useEffect } from 'react';
import player from './Player';
import styledComponents from 'styled-components'
import { createGlobalStyle } from 'styled-components'
import {CardFlip} from './CardFlip'
import {observer} from 'mobx-react'

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

export const Pop = observer((): JSX.Element => { 
    
    //initialSetup
    let plr = player;
    let currentCard =plr.deck[plr.deck.length-1];
   
    function handleAction(statement:boolean)
    {
        plr.nextCardGreater(currentCard,statement);
        currentCard=plr.getCardFromDeck();

    }

    return (
            <>
      <BackgroundLayer/>
      <span>
        <DisplayScore>{plr.score}</DisplayScore>
        </span>
        <CardFlip cardImg={currentCard.getImg()} flipper={currentCard.getBackImg()}>
        </CardFlip>
        <ButtonWrapper>
        <ActionButtons onClick={(e) => {
         handleAction(true);

        }}>Next is greater!</ActionButtons>

        <ActionButtons onClick={(e) => {
                    handleAction(false);

        }}>Next is smaller!</ActionButtons>
        </ButtonWrapper>






    </>);
});
