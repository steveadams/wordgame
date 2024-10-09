import { assertEvent, assign, fromPromise, setup } from 'xstate';

import { KEYS } from '../data';
import type { AlphaChar, GameContext, GameEvents } from '../types';

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
    context: {} as GameContext,
    events: {} as GameEvents,
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
        currentGuess: KEYS.EMPTY,
      };
    }),
    setCurrentGuess: assign(({ context, event }) => {
      assertEvent(event, 'guess');

      return {
        currentGuess: event.guess,
        guessedLetters: [...context.guessedLetters, event.guess],
      };
    }),
    unsetCurrentGuess: assign({
      currentGuess: '',
    }),
    setGuessResult: assign(({ event }) => {
      assertEvent(event, 'xstate.done.actor.guess');

      return {
        current: event.output.current,
        guessesRemaining: event.output.guesses_remaining,
        currentGuess: KEYS.EMPTY,
      };
    }),
  },
  guards: {
    noGuessesRemaining: ({ context }) => context.guessesRemaining === 0,
    allLettersGuessed: ({ context }) => !context.current.includes('_'),
  },
}).createMachine({
  context: {
    id: '',
    guessedLetters: [],
    current: '...',
    guessesRemaining: 0,
    currentGuess: '',
  },
  id: '(machine)',
  initial: 'loading',
  on: {
    new: {
      target: '#(machine).loading',
    },
  },
  states: {
    loading: {
      invoke: {
        id: 'newGame',
        input: {},
        src: 'newGame',
        onDone: {
          target: 'playing',
          actions: 'setGameData',
          onError: {
            target: 'error',
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
      entry: 'setCurrentGuess',
      exit: 'unsetCurrentGuess',
      invoke: {
        id: 'guess',
        src: 'guesser',
        input: ({ context }) => ({
          id: context.id,
          guess: context.currentGuess,
        }),
        onDone: {
          target: 'playing',
          actions: 'setGuessResult',
        },
        onError: {
          target: 'error',
        },
      },
    },
    win: {},
    lose: {},
    error: {
      on: {
        retry: {
          target: 'guessing',
        },
      },
    },
  },
});
