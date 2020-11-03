import React, { useState,useLayoutEffect,useEffect } from 'react';
import ReactDOM, { render } from 'react-dom';
import {Player} from './Player';
import styledComponents from 'styled-components'
import styled, { createGlobalStyle } from 'styled-components'
import ReactCardFlip from 'react-card-flip'

const CardStyle = styled.img`
  width: 600px;
  @media(max-width: 768px)
  {
    width: 700px;
  }

`;

export const CardFlip =(props: any) =>
{
  


    return(
    <ReactCardFlip isFlipped={props.isFlipped}  flipDirection="horizontal">
                <CardStyle src={props.front}/>
                <CardStyle src={props.back}/>

    </ReactCardFlip>      
    )      
           

};
