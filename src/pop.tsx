import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import styled, { createGlobalStyle } from 'styled-components';
import { Player } from './Player';
import { CardGenerator } from './CardGenerator';
import { Card } from './Card';
import CardFlip from './CardFlip';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%);
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-x: hidden;
  }
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 100vh;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: white;
  font-size: 3rem;
  font-weight: 800;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  margin-bottom: 10px;
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const ScoreDisplay = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 15px 40px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ScoreLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
`;

const ScoreValue = styled.div`
  color: white;
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

  @media (max-width: 480px) {
    font-size: 2.5rem;
  }
`;

const CardContainer = styled.div`
  margin: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 40px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    gap: 15px;
  }
`;

const GameButton = styled.button<{ variant?: 'greater' | 'smaller' }>`
  font-size: 1.2rem;
  font-weight: 600;
  padding: 18px 40px;
  background: ${props => props.variant === 'greater'
    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 200px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 16px 30px;
    font-size: 1.1rem;
  }
`;

const GameOverContainer = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border-radius: 30px;
  padding: 50px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;

  @media (max-width: 480px) {
    padding: 30px 20px;
  }
`;

const GameOverTitle = styled.h2`
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const FinalScore = styled.div`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 30px;
  font-weight: 600;
`;

const RestartButton = styled(GameButton)`
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
`;

interface PopProps {
  player?: Player;
}

const Pop: React.FC<PopProps> = observer(({ player: externalPlayer }) => {
  const [player] = useState(() => {
    const p = externalPlayer || new Player();
    if (!externalPlayer) {
      const generator = new CardGenerator();
      p.deck = generator.generateCards();
    }
    return p;
  });

  const [flipped, setFlipped] = useState(false);
  const [actualCard, setActualCard] = useState<Card | undefined>(undefined);
  const [previousCard, setPreviousCard] = useState<Card | undefined>(undefined);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const firstCard = player.getCardFromDeck();
    if (firstCard) {
      setActualCard(firstCard);
    }
  }, []);

  const handleAction = (statement: 'greater' | 'smaller') => {
    if (!actualCard || player.deck.length === 0) {
      setGameOver(true);
      return;
    }

    const isCorrect = player.nextCardGreater(actualCard, statement);

    setFlipped(true);

    setTimeout(() => {
      const nextCard = player.getCardFromDeck();
      setPreviousCard(actualCard);
      setActualCard(nextCard);
      setFlipped(false);

      if (!nextCard || player.deck.length === 0) {
        setGameOver(true);
      }
    }, 1000);
  };

  const handleRestart = () => {
    const generator = new CardGenerator();
    player.deck = generator.generateCards();
    player.score = 0;
    const firstCard = player.getCardFromDeck();
    setActualCard(firstCard);
    setPreviousCard(undefined);
    setFlipped(false);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <>
        <GlobalStyle />
        <GameContainer>
          <GameOverContainer>
            <GameOverTitle>Game Over!</GameOverTitle>
            <FinalScore>Final Score: {player.score}</FinalScore>
            <RestartButton onClick={handleRestart}>
              Play Again
            </RestartButton>
          </GameOverContainer>
        </GameContainer>
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <GameContainer>
        <Header>
          <Title>Flip Dat Card</Title>
        </Header>

        <ScoreDisplay>
          <ScoreLabel>Score</ScoreLabel>
          <ScoreValue>{player.score}</ScoreValue>
        </ScoreDisplay>

        <CardContainer>
          {actualCard && (
            <CardFlip
              isFlipped={flipped}
              front={actualCard.getBackImg()}
              back={actualCard.getImg()}
            />
          )}
        </CardContainer>

        <ButtonContainer>
          <GameButton
            variant="greater"
            onClick={() => handleAction('greater')}
          >
            Next is Higher
          </GameButton>
          <GameButton
            variant="smaller"
            onClick={() => handleAction('smaller')}
          >
            Next is Lower
          </GameButton>
        </ButtonContainer>
      </GameContainer>
    </>
  );
});

export default Pop;
