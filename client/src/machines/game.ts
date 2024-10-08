import { assertEvent, assign, fromPromise, setup } from 'xstate';

import { VALID_KEYS } from '../data';
import type { AlphaChar } from '../types';

type NewGame = {
  id: string;
  guesses_remaining: number;
  current: AlphaChar[];
};

type GuessResult = Omit<NewGame, 'id'>;

const GAME_API_URL = import.meta.env.VITE_GAME_API_URL;

const newGameLogic = fromPromise(async () => {
  const response = await fetch(`${GAME_API_URL}/new`, { method: 'POST' });
  const game = (await response.json()) as NewGame;

  return game;
});

const sendGuessLogic = fromPromise<GuessResult, { id: string; guess: string }>(
  async ({ input }) => {
    const response = await fetch(`${GAME_API_URL}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: input.id, guess: input.guess }),
    });

    const result = (await response.json()) as GuessResult;

    return result;
  },
);

export const gameMachine = setup({
  types: {
    context: {} as {
      id: string;
      guessedLetters: AlphaChar[];
      current: string;
      guessesRemaining: number;
      currentGuess: AlphaChar | '';
    },
    events: {} as
      | { type: 'new' }
      | {
          type: 'start';
          id: string;
          current: string;
          guessesRemaining: number;
        }
      | {
          type: 'xstate.done.actor.newGame';
          output: { id: string; current: string; guesses_remaining: number };
        }
      | {
          type: 'xstate.done.actor.guess';
          output: { id: string; current: string; guesses_remaining: number };
        }
      | { type: 'guess'; guess: AlphaChar }
      | { type: 'fail'; cause: string }
      | { type: 'retry' },
  },
  actors: {
    newGame: newGameLogic,
    guesser: sendGuessLogic,
  },
  actions: {
    setGameData: assign(({ event }) => {
      assertEvent(event, 'xstate.done.actor.newGame');

      return {
        id: event.output.id,
        current: event.output.current,
        guessesRemaining: event.output.guesses_remaining,
        guessedLetters: [],
        currentGuess: VALID_KEYS.EMPTY,
      };
    }),
    setCurrentGuess: assign({
      currentGuess: ({ event }) => {
        assertEvent(event, 'guess');
        return event.guess;
      },
      guessedLetters: ({ context, event }) => {
        assertEvent(event, 'guess');
        return [...context.guessedLetters, event.guess];
      },
    }),
    setGuessResult: assign(({ event }) => {
      assertEvent(event, 'xstate.done.actor.guess');

      return {
        current: event.output.current,
        guessesRemaining: event.output.guesses_remaining,
        currentGuess: VALID_KEYS.EMPTY,
      };
    }),
  },
  guards: {
    noGuessesRemaining: ({ context }) => {
      return context.guessesRemaining === 0;
    },
    allLettersGuessed: ({ context }) => {
      return !context.current.includes('_');
    },
  },
}).createMachine({
  context: {
    id: '',
    guessedLetters: [],
    current: '...',
    guessesRemaining: 0,
    currentGuess: '',
  },
  initial: 'loading',
  on: {
    new: {
      target: '.loading',
    },
  },
  states: {
    idle: {},
    loading: {
      invoke: {
        id: 'newGame',
        src: 'newGame',
        onDone: {
          target: 'playing',
          actions: 'setGameData',
          onError: {
            target: 'failure',
          },
        },
      },
    },
    playing: {
      always: [
        {
          target: 'win',
          guard: 'allLettersGuessed',
        },
        {
          target: 'lose',
          guard: 'noGuessesRemaining',
        },
      ],
      on: {
        guess: {
          target: 'guessing',
        },
      },
    },
    guessing: {
      entry: ['setCurrentGuess'],
      invoke: {
        id: 'guess',
        src: 'guesser',
        input: ({ context }) => ({
          id: context.id,
          guess: context.currentGuess,
        }),
        onDone: {
          target: 'playing',
          actions: ['setGuessResult'],
        },
        onError: {
          target: 'failure',
        },
      },
    },
    win: {},
    lose: {},
    failure: {
      on: {
        retry: {
          target: 'idle',
        },
      },
    },
  },
});
