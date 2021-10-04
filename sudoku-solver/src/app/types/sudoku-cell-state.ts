export interface SudokuCellState{
  row: number;
  col: number;
  value?: number;
  possibilities: number[];
}