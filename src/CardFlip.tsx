import React, { useState,useLayoutEffect,useEffect } from 'react';
import ReactDOM, { render } from 'react-dom';
import {Player} from './Player';
import styledComponents from 'styled-components'
import { createGlobalStyle } from 'styled-components'
import ReactCardFlip from 'react-card-flip'

const CardStyle = styledComponents.img`-i
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 30%;  
`;

export const CardFlip =(props: any) =>
{
  
    const [isFlipped,setIsFlipped] = useState(false);

    const handleClick = () =>
    {
         setIsFlipped(!isFlipped);
    };

    return(
    <ReactCardFlip isFlipped={isFlipped}  flipDirection="horizontal">
                <CardStyle src={props.cardImg} onClick={handleClick}/>
                <CardStyle src={props.flipper} onClick={handleClick}/>

    </ReactCardFlip>      
    )      
           

};
