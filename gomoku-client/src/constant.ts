export enum StoneState {
  NONE,
  BLACK,
  WHITE,
}

export type Board = StoneState[][];

export const BOARD_SIZE = 15;
