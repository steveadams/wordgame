import { ActorRefFrom } from 'xstate';
import { KEYS } from './data';
import { gameMachine } from './machines/game';

export type GameRef = ActorRefFrom<typeof gameMachine>;

export type AlphaChar = (typeof KEYS)[keyof typeof KEYS];

export type GameContext = {
  id: string;
  guessedLetters: AlphaChar[];
  current: string;
  guessesRemaining: number;
  currentGuess: AlphaChar;
};

export type GameEvents =
  | { type: 'new' }
  | { type: 'guess'; guess: AlphaChar }
  | { type: 'retry'; guess: AlphaChar }
  | {
      type: 'xstate.done.actor.newGame';
      output: { id: string; current: string; guesses_remaining: number };
    }
  | {
      type: 'xstate.done.actor.guess';
      output: { id: string; current: string; guesses_remaining: number };
    };
