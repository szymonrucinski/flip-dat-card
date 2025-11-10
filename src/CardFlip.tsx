import React from 'react';
import ReactCardFlip from 'react-card-flip';
import styled from 'styled-components';

const CardImage = styled.img`
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 768px) {
    max-width: 300px;
  }

  @media (max-width: 480px) {
    max-width: 250px;
  }
`;

interface CardFlipProps {
  isFlipped: boolean;
  front: string;
  back: string;
}

const CardFlip: React.FC<CardFlipProps> = ({ isFlipped, front, back }) => {
  return (
    <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
      <CardImage src={front} alt="Card front" />
      <CardImage src={back} alt="Card back" />
    </ReactCardFlip>
  );
};

export default CardFlip;
