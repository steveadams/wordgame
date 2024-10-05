import { useSelector } from '@xstate/react';
import { FC, HTMLProps } from 'react';

import { GameRef } from '../types';
import clsx from 'clsx';

export const Screen: FC<{ game: GameRef }> = ({ game }) => {
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

const StatusBox: FC<{ show?: boolean } & HTMLProps<HTMLSpanElement>> = ({
  children,
  className,
  show,
}) => (
  <span
    className={clsx(
      'flex items-center gap-2 bg-green-950/5 rounded-s-sm px-1 transition-opacity delay-300',
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
