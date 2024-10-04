import { Toaster } from 'sonner';
import { clsx } from 'clsx';
import { gameMachine } from '../machines/game';
import { ActorRefFrom } from 'xstate';
import { FC, HTMLProps, useCallback } from 'react';
import { useActorRef, useSelector } from '@xstate/react';
import { match, P } from 'ts-pattern';

type GameRef = ActorRefFrom<typeof gameMachine>;

type ProgressProps = { current: string };

const Progress: FC<ProgressProps> = ({ current }) => {
  return (
    <ul className="flex gap-1 justify-center content-center text-center text-2xl">
      {current.split('').map((letter, index) => (
        <li
          key={`${letter}_${index}`}
          className="bg-green-800/10 text-green-950 rounded-s-sm p-1 size-10"
        >
          {letter}
        </li>
      ))}
    </ul>
  );
};

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

const keySizeClasses = {
  square: 'size-12',
  full: 'h-12 flex-grow',
  wide: 'h-12 min-w-60 text-center',
} as const;

type KeyColor = keyof typeof keyColorClasses;
type KeySize = keyof typeof keySizeClasses;

const Key: FC<
  {
    onClick?: () => void;
    size?: KeySize;
    color?: KeyColor;
    disabled?: boolean;
    pending?: boolean;
  } & HTMLProps<HTMLElement>
> = ({
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

const Clock: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="size-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const Smile: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="size-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
    />
  </svg>
);

const Frown: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="size-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
    />
  </svg>
);

const StatusBox: FC<{ show?: boolean } & HTMLProps<HTMLSpanElement>> = ({
  children,
  className,
  show,
}) => (
  <span
    className={clsx(
      'flex items-center gap-2 bg-green-950/5 rounded-s-sm px-1 transition-opacity',
      className,
      {
        'opacity-10': show === false,
        'opacity-95': show === true || show === undefined,
      },
    )}
  >
    {children}
  </span>
);

const Screen: FC<{ game: GameRef }> = ({ game }) => {
  const guessesRemaining = useSelector(
    game,
    (snap) => snap.context.guessesRemaining,
  );

  const current = useSelector(game, (snap) => snap.context.current);

  const loading = useSelector(game, (snap) => snap.matches('loading'));
  const guessing = useSelector(game, (snap) => snap.matches('guessing'));
  const win = useSelector(game, (snap) => snap.matches('win'));
  const lose = useSelector(game, (snap) => snap.matches('lose'));

  return (
    <div
      className="flex flex-col gap-2 w-full p-2 content-center justify-between text-green-950/90 bg-gradient-to-b from-green-300/95 to-green-400/95 whitespace-nowrap rounded-md shadow-inner shadow-green-900 silkscreen-regular"
      style={{ textShadow: '0 0.1rem 0 rgba(0, 0, 0, 0.1)' }}
    >
      <div className="flex justify-between gap-y-4 text-sm whitespace-nowrap">
        <StatusBox show={loading}>
          <Clock />
          <span>LOADING...</span>
        </StatusBox>

        <StatusBox show={guessing}>
          <Clock />
          <span>WORKING...</span>
        </StatusBox>

        <StatusBox className={clsx({ 'animate-pulse': win })} show={win}>
          <Smile /> YOU WON
        </StatusBox>

        <StatusBox className={clsx({ 'animate-pulse': lose })} show={lose}>
          <Frown /> YOU LOST
        </StatusBox>

        <StatusBox>
          GUESSES: <span className="silkscreen-bold">{guessesRemaining}</span>
        </StatusBox>
      </div>

      <div
        className={clsx(
          { 'opacity-50': loading, 'opacity-100': !loading },
          'transition-opacity',
        )}
      >
        <Progress current={current} />
      </div>
    </div>
  );
};

const Keyboard = ({ game }: { game: GameRef }) => {
  const guessedLetters = useSelector(
    game,
    (snap) => snap.context.guessedLetters,
  );
  const current = useSelector(game, (snap) => snap.context.current);
  const currentGuess = useSelector(game, (snap) => snap.context.currentGuess);
  const playing = useSelector(game, (snap) => snap.matches('playing'));
  const loading = useSelector(game, (snap) => snap.matches('loading'));

  const letterKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  const startNewGame = useCallback(() => game.send({ type: 'new' }), [game]);

  console.log({ currentGuess });

  return (
    <div className="grid gap-1">
      {letterKeys.map((row) => (
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
                    onClick={() =>
                      game.send({ type: 'setGuess', guess: letter })
                    }
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

export const Game = () => {
  const ref = useActorRef(gameMachine);

  return (
    <div className="flex flex-col gap-4 container items-center text-center justify-center content-center">
      <div className="keyboard bg-slate-700 p-2 w-full rounded-2xl shadow-lg relative box-border font-mono">
        <div className="keyboard-inner flex flex-col gap-[0.25rem] p-2 overflow-hidden bg-gray-900 rounded-lg shadow-inner">
          <Screen game={ref} />
          <Keyboard game={ref} />
        </div>
      </div>
    </div>
  );
};

const App: FC = () => (
  <>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <main className="mx-auto max-w-3xl flex flex-col gap-8">
        <h1 className="w-min h-min text-6xl whitespace-nowrap leading-tight bg-clip-text text-transparent bg-gradient-to-tr from-green-200 to-cyan-200 silkscreen-regular">
          Glyph Guesser
        </h1>
        <p className="text-md text-green-200 font-mono">
          Guess the missing letters! You've got 6 tries.
        </p>
        <Game />
      </main>
    </div>

    <Toaster />
  </>
);

export default App;
