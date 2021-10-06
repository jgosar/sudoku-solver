import { SudokuStoreState } from "../services/sudoku-store.state";
import { SudokuCellState } from "../types/sudoku-cell-state";

export function setCellValue(sudokuState: SudokuStoreState, rowIndex: number, colIndex: number, value: number): SudokuCellState[][]{
  return sudokuState.sudokuData.map((row, rowNum)=>row.map((cell, colNum)=>{
    if(rowNum===rowIndex && colNum === colIndex){
      return {
        ...sudokuState.sudokuData[rowNum][colNum],
        value,
        possibilities: [],
      };
    } else if(areCellsMutuallyExclusive(sudokuState, rowNum, colNum, rowIndex, colIndex)){
      return removePossibility(cell, value);
    } else{
      return cell;
    }
  }));
}

export function removeCellPossibility(sudokuState: SudokuStoreState, rowIndex: number, colIndex: number, value: number): SudokuCellState[][]{
  return sudokuState.sudokuData.map((row)=>row.map((cell)=>{
      if(cell.row===rowIndex && cell.col === colIndex){
        return removePossibility(cell, value);
      } else{
        return cell;
      }
    }));
}

function areCellsMutuallyExclusive(sudokuState: SudokuStoreState, row1: number, col1: number, row2: number, col2: number) {
  return row1 === row2 || col1 === col2 || isInSameSquare(sudokuState, row1, col1, row2, col2);
}

function isInSameSquare(sudokuState: SudokuStoreState, row1: number, col1: number, row2: number, col2: number): boolean {
  return (Math.floor(row1 / sudokuState.squareHeight) === Math.floor(row2 / sudokuState.squareHeight) && Math.floor(col1 / sudokuState.squareWidth) === Math.floor(col2 / sudokuState.squareWidth));
}

function removePossibility(cellState: SudokuCellState, possibility: number): SudokuCellState{
  return {
    ...cellState,
    possibilities: cellState.possibilities.filter(p=>p!==possibility)
  };
}
