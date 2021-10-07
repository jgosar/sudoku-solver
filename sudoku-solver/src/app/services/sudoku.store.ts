import { Injectable, Injector } from "@angular/core";
import { range } from "../helpers/array.helpers";
import { executeAction, setCellValue } from "../helpers/sudoku.helpers";
import { tryToSolveAsync } from "../logic/sudoku-solver";
import { SudokuCellState } from "../types/sudoku-cell-state";
import { SudokuChangeAction } from "../types/sudoku-change-action";
import { SudokuStoreState } from "./sudoku-store.state";

export class SudokuStore{
  state: SudokuStoreState;

  constructor(squareWidth: number, squareHeight: number) {
    this.state = {squareWidth,squareHeight, sudokuData: this.initSudokuData(squareWidth*squareHeight)}
  }

  processCellValueClick(action: SudokuChangeAction){
    this.state.sudokuData = executeAction(this.state, action);
    
    tryToSolveAsync(this.state).subscribe(actions=>{
      this.state = actions.reduce((state, action)=>({...state, sudokuData: executeAction(state, action)}), this.state);
    });
  }

  private initSudokuData(dimension: number): SudokuCellState[][]{
    return range(dimension)
      .map(rowNum=>range(dimension)
        .map(colNum=>({
          row: rowNum,
          col: colNum,
          possibilities: range(dimension).map(x=>x+1)
        })
      )
    );
  }
}
