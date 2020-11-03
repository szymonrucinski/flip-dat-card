import React, { useState,useLayoutEffect,useEffect } from 'react';
import player from './Player';
import styledComponents from 'styled-components'
import styled, { createGlobalStyle } from 'styled-components'
import {CardFlip} from './CardFlip'
import {observer} from 'mobx-react'
const BackgroundLayer = createGlobalStyle`
body{
    background: green;
    font-family: 'Ubuntu Mono', monospace;
    display:flex;
    justify-content: center;
    }

`;

const DisplayScore = styledComponents.div`
text-align:center;
color: white;
font-size: 4em;
padding-bottom: 40px;
`;

const ButtonWrapper = styled.div`
padding-top: 40px;

`;


const ActionButtons = styled.button`
font-size: 30px;
text-align: center; 
height: 60px;
background:red;
border-radius:15px;
outline-color:none;
font-family: 'Ubuntu Mono', monospace;
color:white;
cursor: pointer;
`;

const Divider = styled.div`
  width: 10px;
  height: auto;
  display: inline-block;
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
    const [flipped, setFlipped] = useState(false)
    const [front, setFront] = useState(currentCard.getImg())
    const [back, setBack] = useState('')
    const [actualCard, setactualCard] = useState(currentCard.getImg())
    const [previousCard, setPreviousCard] = useState('')

    const handleFlip = () => 
    {
        if (flipped === false)
        {
            currentCard=plr.getCardFromDeck();
            setBack(currentCard.getImg())
            setFlipped(!flipped)
            console.log(flipped)
        }
        else { 
            setBack(currentCard.getImg())
            setFlipped(!flipped)
                

        }

    }

    return (
            <>
      <BackgroundLayer/>
      <span>
        <DisplayScore>{plr.score}</DisplayScore>
        </span>
        <CardFlip isFlipped={flipped} front={front} back={back} flipDirection="horizontal">
        </CardFlip>
        <ButtonWrapper>
        <ActionButtons onClick={(e) => {
         handleAction(true);

        }}>Next is greater!</ActionButtons>
        <Divider/>
        <ActionButtons onClick={(e) => {
                    handleAction(false); handleFlip();

        }}>Next is smaller!</ActionButtons>
        </ButtonWrapper>






    </>);
});
