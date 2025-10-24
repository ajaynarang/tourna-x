export interface ScoringFormat {
  pointsPerGame: number; // 11, 15, or 21
  gamesPerMatch: number; // 1 or 3
  winBy: number; // 1 or 2
  maxPoints: number; // Maximum points before game ends
}

export interface GameScore {
  player1Score: number;
  player2Score: number;
  winner?: 'player1' | 'player2';
  isDeuce: boolean;
  isGameComplete: boolean;
}

export interface MatchScore {
  games: GameScore[];
  player1GamesWon: number;
  player2GamesWon: number;
  winner?: 'player1' | 'player2';
  isMatchComplete: boolean;
  currentGame: number;
}

/**
 * Check if a game is complete based on scoring rules
 */
export function isGameComplete(
  player1Score: number,
  player2Score: number,
  scoringFormat: ScoringFormat
): { isComplete: boolean; winner?: 'player1' | 'player2'; isDeuce: boolean } {
  const { pointsPerGame, winBy, maxPoints } = scoringFormat;
  
  // Check if either player has reached maximum points
  if (player1Score >= maxPoints || player2Score >= maxPoints) {
    return {
      isComplete: true,
      winner: player1Score > player2Score ? 'player1' : 'player2',
      isDeuce: false
    };
  }
  
  // Check if either player has reached the target points
  if (player1Score >= pointsPerGame || player2Score >= pointsPerGame) {
    const scoreDiff = Math.abs(player1Score - player2Score);
    
    // If winBy is 1, first to reach target wins
    if (winBy === 1) {
      return {
        isComplete: true,
        winner: player1Score > player2Score ? 'player1' : 'player2',
        isDeuce: false
      };
    }
    
    // If winBy is 2, must win by 2 points
    if (winBy === 2) {
      if (scoreDiff >= 2) {
        return {
          isComplete: true,
          winner: player1Score > player2Score ? 'player1' : 'player2',
          isDeuce: false
        };
      } else {
        // Game is in deuce state
        return {
          isComplete: false,
          winner: undefined,
          isDeuce: true
        };
      }
    }
  }
  
  return {
    isComplete: false,
    winner: undefined,
    isDeuce: false
  };
}

/**
 * Check if a match is complete based on games won
 */
export function isMatchComplete(
  player1GamesWon: number,
  player2GamesWon: number,
  gamesPerMatch: number
): { isComplete: boolean; winner?: 'player1' | 'player2' } {
  const gamesNeeded = Math.ceil(gamesPerMatch / 2);
  
  if (player1GamesWon >= gamesNeeded) {
    return {
      isComplete: true,
      winner: 'player1'
    };
  }
  
  if (player2GamesWon >= gamesNeeded) {
    return {
      isComplete: true,
      winner: 'player2'
    };
  }
  
  return {
    isComplete: false,
    winner: undefined
  };
}

/**
 * Update game score and check for completion
 */
export function updateGameScore(
  currentGame: GameScore,
  scoringPlayer: 'player1' | 'player2',
  scoringFormat: ScoringFormat
): GameScore {
  const newScore = {
    player1Score: currentGame.player1Score + (scoringPlayer === 'player1' ? 1 : 0),
    player2Score: currentGame.player2Score + (scoringPlayer === 'player2' ? 1 : 0),
    winner: currentGame.winner,
    isDeuce: currentGame.isDeuce,
    isGameComplete: currentGame.isGameComplete
  };
  
  const gameStatus = isGameComplete(
    newScore.player1Score,
    newScore.player2Score,
    scoringFormat
  );
  
  return {
    ...newScore,
    winner: gameStatus.winner,
    isDeuce: gameStatus.isDeuce,
    isGameComplete: gameStatus.isComplete
  };
}

/**
 * Update match score and check for completion
 */
export function updateMatchScore(
  currentMatch: MatchScore,
  scoringPlayer: 'player1' | 'player2',
  scoringFormat: ScoringFormat
): MatchScore {
  const currentGameIndex = currentMatch.currentGame - 1;
  const currentGame = currentMatch.games[currentGameIndex];
  
  if (!currentGame) {
    // Start new game
    const newGame: GameScore = {
      player1Score: scoringPlayer === 'player1' ? 1 : 0,
      player2Score: scoringPlayer === 'player2' ? 1 : 0,
      winner: undefined,
      isDeuce: false,
      isGameComplete: false
    };
    
    const gameStatus = isGameComplete(
      newGame.player1Score,
      newGame.player2Score,
      scoringFormat
    );
    
    newGame.winner = gameStatus.winner;
    newGame.isDeuce = gameStatus.isDeuce;
    newGame.isGameComplete = gameStatus.isComplete;
    
    const updatedGames = [...currentMatch.games, newGame];
    
    let player1GamesWon = currentMatch.player1GamesWon;
    let player2GamesWon = currentMatch.player2GamesWon;
    
    if (newGame.isGameComplete && newGame.winner) {
      if (newGame.winner === 'player1') {
        player1GamesWon++;
      } else {
        player2GamesWon++;
      }
    }
    
    const matchStatus = isMatchComplete(
      player1GamesWon,
      player2GamesWon,
      scoringFormat.gamesPerMatch
    );
    
    return {
      games: updatedGames,
      player1GamesWon,
      player2GamesWon,
      winner: matchStatus.winner,
      isMatchComplete: matchStatus.isComplete,
      currentGame: newGame.isGameComplete ? currentMatch.currentGame + 1 : currentMatch.currentGame
    };
  }
  
  // Update existing game
  const updatedGame = updateGameScore(currentGame, scoringPlayer, scoringFormat);
  const updatedGames = [...currentMatch.games];
  updatedGames[currentGameIndex] = updatedGame;
  
  let player1GamesWon = currentMatch.player1GamesWon;
  let player2GamesWon = currentMatch.player2GamesWon;
  
  if (updatedGame.isGameComplete && updatedGame.winner) {
    if (updatedGame.winner === 'player1') {
      player1GamesWon++;
    } else {
      player2GamesWon++;
    }
  }
  
  const matchStatus = isMatchComplete(
    player1GamesWon,
    player2GamesWon,
    scoringFormat.gamesPerMatch
  );
  
  return {
    games: updatedGames,
    player1GamesWon,
    player2GamesWon,
    winner: matchStatus.winner,
    isMatchComplete: matchStatus.isComplete,
    currentGame: updatedGame.isGameComplete ? currentMatch.currentGame + 1 : currentMatch.currentGame
  };
}

/**
 * Get display text for current game state
 */
export function getGameDisplayText(game: GameScore, scoringFormat: ScoringFormat): string {
  if (game.isGameComplete && game.winner) {
    return `${game.player1Score}-${game.player2Score} (${game.winner === 'player1' ? 'Player 1' : 'Player 2'} wins)`;
  }
  
  if (game.isDeuce) {
    return `${game.player1Score}-${game.player2Score} (Deuce)`;
  }
  
  return `${game.player1Score}-${game.player2Score}`;
}

/**
 * Get display text for match state
 */
export function getMatchDisplayText(match: MatchScore): string {
  if (match.isMatchComplete && match.winner) {
    return `${match.player1GamesWon}-${match.player2GamesWon} (${match.winner === 'player1' ? 'Player 1' : 'Player 2'} wins match)`;
  }
  
  return `${match.player1GamesWon}-${match.player2GamesWon}`;
}

/**
 * Initialize a new match with empty games
 */
export function initializeMatch(scoringFormat: ScoringFormat): MatchScore {
  return {
    games: [],
    player1GamesWon: 0,
    player2GamesWon: 0,
    winner: undefined,
    isMatchComplete: false,
    currentGame: 1
  };
}
