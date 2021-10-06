import { SudokuCellState } from "../types/sudoku-cell-state";

export interface SudokuStoreState{
  squareWidth: number;
  squareHeight: number;
  sudokuData: SudokuCellState[][];
}
