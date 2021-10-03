import { SudokuCellState } from "./sudoku-cell-state";

export interface SudokuActionResult{
  sudokuData: SudokuCellState[][];
  anyChanges: boolean;
}
