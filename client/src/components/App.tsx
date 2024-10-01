import { ParentComponent, type Component } from "solid-js";
import { Match, Switch } from "solid-js";
import { useActor } from "@xstate/solid";
import { Toaster } from "solid-sonner";
import { clsx } from "clsx";
import { gameMachine } from "../machines/game";

type ProgressProps = { progress: string };

const Progress: Component<ProgressProps> = ({ progress }) => {
  return (
    <ul class="flex gap-1 justify-center content-center text-center text-2xl">
      {progress &&
        progress
          .split("")
          .map((letter) => (
            <li class="bg-neutral-200 rounded-md p-1 size-10">{letter}</li>
          ))}
    </ul>
  );
};

const Key: ParentComponent<{
  onClick: () => void;
  sizeClass?: string;
  disabled?: boolean;
}> = ({ onClick, disabled, sizeClass, children }) => {
  return (
    <div class="w-min h-min p-1 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg">
      <div
        class={clsx(
          "p-[0.025rem] relative overflow-hidden bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg transform translate-z-0 animate-shadow",
          sizeClass
        )}
      >
        <button
          class="w-full h-full bg-slate-600 relative rounded-md text-md flex items-start justify-start text-white z-10 cursor-pointer select-none shadow-md transition-all duration-100 ease-in-out active:top-0 active:shadow-sm active:bg-opacity-90"
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </button>
      </div>
    </div>
  );
};

const Keyboard = ({
  guessedLetters,
  send,
  snapshot,
}: {
  guessedLetters: string[];
  send: ReturnType<typeof useActor<typeof gameMachine>>[1];
  snapshot: ReturnType<typeof useActor<typeof gameMachine>>[0];
}) => {
  const qwertyLayout = [
    "qwertyuiop".split(""),
    "asdfghjkl".split(""),
    "zxcvbnm".split(""),
  ];

  return (
    <div class="keyboard bg-gray-700 p-2 rounded-2xl shadow-lg relative box-border font-mono">
      <div class="keyboard-inner flex flex-col gap-[0.25rem] p-2.5 overflow-hidden bg-gray-900 rounded-lg shadow-inner">
        <Key onClick={() => send({ type: "new" })} sizeClass="h-12 w-full">
          <span class="pl-2 pr-8 py-0.5 whitespace-nowrap">NEW GAME</span>
        </Key>
        {qwertyLayout.map((row) => (
          <div class="flex gap-[0.25rem] justify-center">
            {row.map((letter) => (
              <Key
                onClick={() => send({ type: "setGuess", guess: letter })}
                disabled={
                  guessedLetters.includes(letter) ||
                  !snapshot.matches("playing")
                }
                sizeClass="size-12"
              >
                <span class="px-2 py-0.5 whitespace-nowrap">
                  {letter.toUpperCase()}
                </span>
              </Key>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Game = () => {
  const [snapshot, send] = useActor(gameMachine);

  return (
    <div class="flex flex-col gap-4 container p-4 items-center text-center justify-center content-center bg-neutral-50">
      {JSON.stringify(snapshot.context)}
      <Switch fallback={null}>
        <Match when={snapshot.matches("idle")}>
          <h2>Ready</h2>
          <Keyboard
            guessedLetters={snapshot.context.guessedLetters}
            send={send}
            snapshot={snapshot}
          />
          <button onClick={() => send({ type: "new" })}>Play</button>
        </Match>

        <Match when={snapshot.matches("loading")}>
          <h2 class="text-neutral-500">Loading...</h2>
          <Progress progress={snapshot.context.current} />
          <Keyboard
            guessedLetters={snapshot.context.guessedLetters}
            send={send}
            snapshot={snapshot}
          />
        </Match>

        <Match when={snapshot.matches("playing")}>
          <h2>Playing</h2>
          <Progress progress={snapshot.context.current} />
          <Keyboard
            guessedLetters={snapshot.context.guessedLetters}
            send={send}
            snapshot={snapshot}
          />
        </Match>

        <Match when={snapshot.matches("guessing")}>
          <h2 class="text-neutral-500">Guessing...</h2>
          <Progress progress={snapshot.context.current} />
          <Keyboard
            guessedLetters={snapshot.context.guessedLetters}
            send={send}
            snapshot={snapshot}
          />
        </Match>

        <Match when={snapshot.matches("win")}>You win</Match>
        <Match when={snapshot.matches("lose")}>You lose</Match>
      </Switch>
    </div>
  );
};

const App: Component = () => (
  <>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 font-serif">
      <main class="mx-auto max-w-3xl flex flex-col gap-8">
        <h1 class="text-4xl font-bold">Wordgame</h1>

        <Game />
      </main>
    </div>

    <Toaster
      toastOptions={{
        unstyled: true,
        classes: {
          toast:
            "flex gap-2 items-center justify-center bg-white p-4 rounded-lg shadow-lg ring-1 ring-offset-1 ring-gray-900/10",
          error: "bg-red-50 text-red-600 ring-red-600/50",
          success: "bg-green-50 text-green-600 ring-green-600/50",
        },
      }}
    />
  </>
);

export default App;
