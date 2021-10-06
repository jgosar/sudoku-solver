export interface SudokuChangeAction{
  rowIndex: number;
  colIndex: number;
  setValue?: number;
  removePossibility?: number;
}
