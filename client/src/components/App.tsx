import { Toaster } from 'sonner';
import { gameMachine } from '../machines/game';
import { FC } from 'react';
import { useActorRef } from '@xstate/react';

import { Keyboard } from './Keyboard';
import { Screen } from './Screen';

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
        <h1 className="w-min h-min text-6xl whitespace-nowrap leading-tight bg-clip-text text-transparent bg-gradient-to-tr from-emerald-500 to-cyan-500 dark:from-green-200 dark:to-cyan-200 silkscreen-regular">
          Glyphy
        </h1>
        <p className="text-md text-emerald-500 dark:text-green-200 font-mono">
          Guess the missing letters! You've got 6 tries.
        </p>
        <Game />
      </main>
    </div>

    <Toaster />
  </>
);

export default App;
