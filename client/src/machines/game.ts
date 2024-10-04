import { assertEvent, assign, fromPromise, setup } from 'xstate';

type NewGame = {
  id: string;
  guesses_remaining: number;
  current: string;
};

type GuessResult = Omit<NewGame, 'id'>;

const newGameLogic = fromPromise(async () => {
  const response = await fetch('http://localhost:1337/new', { method: 'POST' });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const game = (await response.json()) as NewGame;

  return game;
});

const sendGuessLogic = fromPromise<GuessResult, { id: string; guess: string }>(
  async ({ input }) => {
    const response = await fetch('http://localhost:1337/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: input.id, guess: input.guess }),
    });

    const result = (await response.json()) as GuessResult;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return result;
  },
);

export const gameMachine = setup({
  types: {
    context: {} as {
      id: string;
      guessedLetters: string[];
      current: string;
      guessesRemaining: number;
      currentGuess: string;
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
      | { type: 'setGuess'; guess: string }
      | { type: 'updateGuesses'; guess: string }
      | { type: 'guess'; guess: string }
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
        currentGuess: '',
      };
    }),
    setCurrentGuess: assign({
      currentGuess: ({ event }) => {
        assertEvent(event, 'setGuess');
        return event.guess;
      },
      guessedLetters: ({ context, event }) => {
        assertEvent(event, 'setGuess');
        return [...context.guessedLetters, event.guess];
      },
    }),
    setGuessResult: assign(({ event }) => {
      assertEvent(event, 'xstate.done.actor.guess');

      return {
        current: event.output.current,
        guessesRemaining: event.output.guesses_remaining,
        currentGuess: '',
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
      entry: () => console.log('entered loading'),
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
      entry: () => console.log('enter playing'),
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
        setGuess: {
          actions: 'setCurrentGuess',
          target: 'guessing',
        },
      },
    },
    guessing: {
      entry: () => console.log('enter guessing'),
      invoke: {
        id: 'guess',
        src: 'guesser',
        input: ({ context }) => ({
          id: context.id,
          guess: context.currentGuess,
        }),
        onDone: {
          target: 'playing',
          actions: [
            () => console.log('setGuessResult should run'),
            'setGuessResult',
          ],
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
