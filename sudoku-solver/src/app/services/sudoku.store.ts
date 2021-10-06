import { Injectable, Injector } from "@angular/core";
import { range } from "../helpers/array.helpers";
import { setCellValue } from "../helpers/sudoku.helpers";
import { tryToSolve } from "../logic/sudoku-solver";
import { SudokuCellState } from "../types/sudoku-cell-state";
import { SudokuPosibillityClickEvent } from "../types/sudoku-possibility-click-event";
import { SudokuStoreState } from "./sudoku-store.state";

export class SudokuStore{
  state: SudokuStoreState;

  constructor(squareWidth: number, squareHeight: number) {
    this.state = {squareWidth,squareHeight, sudokuData: this.initSudokuData(squareWidth*squareHeight)}
  }

  processCellValueClick(event: SudokuPosibillityClickEvent){
    this.state.sudokuData = setCellValue(this.state, event.rowIndex, event.colIndex, event.value);

    this.state = {...this.state, sudokuData: tryToSolve(this.state)};
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
