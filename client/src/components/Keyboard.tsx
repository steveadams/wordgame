import clsx from 'clsx';
import type { FC, HTMLProps } from 'react';
import { useCallback } from 'react';
import { useSelector } from '@xstate/react';
import { match, P } from 'ts-pattern';

import { GameRef } from '../types';
import { KEY_LAYOUT } from '../data';

const keyColorClasses = {
  slate: [
    'from-slate-700 to-slate-800',
    'from-slate-500 to-slate-600',
    'bg-slate-600',
  ],
  green: [
    'from-green-700 to-green-800',
    'from-green-500 to-green-600',
    'bg-green-600',
  ],
  amber: [
    'from-amber-700 to-amber-800',
    'from-amber-500 to-amber-600',
    'bg-amber-600',
  ],
  red: ['from-red-700 to-red-800', 'from-red-500 to-red-600', 'bg-red-600'],
} as const;

export const keySizeClasses = {
  square: 'size-12',
  full: 'h-12 flex-grow',
  wide: 'h-12 min-w-60 text-center',
} as const;

type KeyColor = keyof typeof keyColorClasses;
type KeySize = keyof typeof keySizeClasses;

type KeyProps = {
  onClick?: () => void;
  size?: KeySize;
  color?: KeyColor;
  disabled?: boolean;
  pending?: boolean;
} & HTMLProps<HTMLElement>;

const Key: FC<KeyProps> = ({
  onClick,
  disabled,
  color = 'slate' as KeyColor,
  pending = false,
  children,
}) => {
  const colorClass = keyColorClasses[color];

  return (
    <div
      className={clsx(
        'p-1 bg-gradient-to-br rounded-lg active:translate-y-0.5 min-w-fit size-12',
        colorClass[0],
        { 'animate-pulse': pending },
      )}
    >
      <div
        className={clsx(
          'p-[0.025rem] relative bg-gradient-to-br rounded-lg transform translate-z-0 w-full h-full',
          colorClass[1],
        )}
      >
        <button
          className={clsx(
            'w-full h-full px-2 py-0.5 whitespace-nowrap relative rounded-md text-md flex text-white z-10 cursor-pointer select-none shadow-md transition-all duration-100 ease-in-out active:top-0 active:shadow-sm active:bg-opacity-90',
            colorClass[2],
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </button>
      </div>
    </div>
  );
};

export const Keyboard = ({ game }: { game: GameRef }) => {
  const guessedLetters = useSelector(
    game,
    (snap) => snap.context.guessedLetters,
  );
  const current = useSelector(game, (snap) => snap.context.current);
  const currentGuess = useSelector(game, (snap) => snap.context.currentGuess);
  const playing = useSelector(game, (snap) => snap.matches('playing'));
  const loading = useSelector(game, (snap) => snap.matches('loading'));

  const startNewGame = useCallback(() => game.send({ type: 'new' }), [game]);

  return (
    <div className="grid gap-1">
      {KEY_LAYOUT.map((row) => (
        <div key={row.join('')} className="flex gap-[0.25rem] justify-center">
          {row.map((letter) =>
            match({ guessedLetters, current, currentGuess })
              .with(
                {
                  guessedLetters: P.when(
                    (guessed) => !guessed.includes(letter),
                  ),
                },
                () => (
                  <Key
                    key={letter}
                    onClick={() => game.send({ type: 'guess', guess: letter })}
                    disabled={!playing}
                  >
                    {letter}
                  </Key>
                ),
              )
              .with(
                {
                  currentGuess: P.when((guess) => guess == letter),
                },
                () => (
                  <Key key={letter} disabled={true} pending={true}>
                    {letter}
                  </Key>
                ),
              )
              .with(
                { current: P.when((current) => current.includes(letter)) },
                () => (
                  <Key color="green" key={letter}>
                    {letter}
                  </Key>
                ),
              )
              .otherwise(() => (
                <Key color="red" key={letter}>
                  {letter}
                </Key>
              )),
          )}
        </div>
      ))}
      <div className="flex w-full gap-[0.25rem] justify-center">
        <Key onClick={startNewGame} color="amber" disabled={loading}>
          <span className="mx-8">NEW GAME</span>
        </Key>
      </div>
    </div>
  );
};
