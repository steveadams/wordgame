import { ActorRefFrom } from 'xstate';
import { VALID_KEYS } from './data';
import { gameMachine } from './machines/game';

export type GameRef = ActorRefFrom<typeof gameMachine>;

export type AlphaChar = (typeof VALID_KEYS)[keyof typeof VALID_KEYS];
