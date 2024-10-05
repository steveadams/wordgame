import { ActorRefFrom } from 'xstate';
import { gameMachine } from './machines/game';

export type GameRef = ActorRefFrom<typeof gameMachine>;
