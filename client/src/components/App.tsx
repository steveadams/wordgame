import { Toaster } from 'sonner';
import { clsx } from 'clsx';
import { gameMachine } from '../machines/game';
import { ActorRefFrom } from 'xstate';
import { FC, HTMLProps } from 'react';
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

type KeyColor = keyof typeof keyColorClasses;

const Key: FC<
  {
    onClick?: () => void;
    sizeClass?: string;
    color?: KeyColor;
    disabled?: boolean;
  } & HTMLProps<HTMLElement>
> = ({ onClick, disabled, sizeClass, color = 'slate', children }) => {
  const colorClass = keyColorClasses[color];

  return (
    <div
      className={clsx(
        'p-1 bg-gradient-to-br rounded-lg active:translate-y-0.5',
        colorClass[0],
      )}
    >
      <div
        className={clsx(
          'p-[0.025rem] relative bg-gradient-to-br rounded-lg transform translate-z-0 animate-shadow',
          sizeClass,
          colorClass[1],
        )}
      >
        <button
          className={clsx(
            'w-full h-full relative rounded-md text-md flex items-start justify-start text-white z-10 cursor-pointer select-none shadow-md transition-all duration-100 ease-in-out active:top-0 active:shadow-sm active:bg-opacity-90',
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

const Keyboard = ({ game }: { game: GameRef }) => {
  const guessesRemaining = useSelector(
    game,
    (snap) => snap.context.guessesRemaining,
  );
  const guessedLetters = useSelector(
    game,
    (snap) => snap.context.guessedLetters,
  );
  const current = useSelector(game, (snap) => snap.context.current);

  console.log({
    remaining: guessesRemaining,
    guessed: guessedLetters,
    current: current,
  });

  const qwertyLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <div className="keyboard bg-gray-700 p-2 rounded-2xl shadow-lg relative box-border font-mono">
      <div className="keyboard-inner flex flex-col gap-[0.25rem] p-2 overflow-hidden bg-gray-900 rounded-lg shadow-inner">
        <div className="w-full px-4 py-2 flex flex-col gap-2 content-center justify-between text-green-950/90 bg-gradient-to-b from-green-300/95 to-green-400/95 whitespace-nowrap rounded-md shadow-inner shadow-green-900">
          <div className="flex justify-end gap-y-4">
            <span
              className="text-sm whitespace-nowrap flex gap-x-0.5 text-green-900"
              style={{ textShadow: '0 0.1rem 0 rgba(0, 0, 0, 0.1)' }}
            >
              <span className="bg-green-950/5 rounded-s-sm px-1">
                GUESSES:{' '}
              </span>
              <span className="font-bold bg-green-950/5 rounded-s-sm px-1">
                {guessesRemaining}
              </span>
            </span>
          </div>

          <Progress current={current} />
        </div>

        <div className="grid gap-1">
          {qwertyLayout.map((row) => (
            <div
              key={row.join('')}
              className="flex gap-[0.25rem] justify-center"
            >
              {row.map((letter) =>
                match(game.getSnapshot().context)
                  .with(
                    {
                      guessedLetters: P.when(
                        (letters) => !letters.includes(letter),
                      ),
                    },
                    () => (
                      <Key
                        key={letter}
                        onClick={() =>
                          game.send({ type: 'setGuess', guess: letter })
                        }
                        disabled={!game.getSnapshot().matches('playing')}
                        sizeClass="size-12"
                      >
                        <span className="px-2 py-0.5 whitespace-nowrap">
                          {letter}
                        </span>
                      </Key>
                    ),
                  )
                  .with(
                    { current: P.when((current) => current.includes(letter)) },
                    () => (
                      <Key sizeClass="size-12" color="green" key={letter}>
                        <span className="px-2 py-0.5 whitespace-nowrap">
                          {letter}
                        </span>
                      </Key>
                    ),
                  )
                  .otherwise(() => (
                    <Key sizeClass="size-12" color="red" key={letter}>
                      <span className="px-2 py-0.5 whitespace-nowrap">
                        {letter}
                      </span>
                    </Key>
                  )),
              )}
            </div>
          ))}
          <div className="flex w-full bg-red-500 gap-[0.25rem] justify-center">
            <Key
              onClick={() => game.send({ type: 'new' })}
              color="amber"
              sizeClass="flex-1 h-12 whitespace-nowrap content-center align-center"
            >
              <span className="px-2 py-0.5 whitespace-nowrap">NEW GAME</span>
            </Key>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Game = () => {
  const ref = useActorRef(gameMachine);

  return (
    <div className="flex flex-col gap-4 container p-4 items-center text-center justify-center content-center">
      <Keyboard game={ref} />
    </div>
  );
};

const App: FC = () => (
  <>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 font-mono">
      <main className="mx-auto max-w-3xl flex flex-col gap-8">
        <h1 className="text-4xl font-bold">Wordgame</h1>

        <Game />
      </main>
    </div>

    <Toaster />
  </>
);

export default App;
