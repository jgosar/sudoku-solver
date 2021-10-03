import { Component } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { range } from 'src/app/helpers/array.helpers';
import { SudokuActionResult } from 'src/app/types/sudoku-action-result';
import { SudokuCellState } from 'src/app/types/sudoku-cell-state';

@Component({
  selector: 'sus-sudoku-grid',
  templateUrl: './sudoku-grid.component.html',
  styleUrls: ['./sudoku-grid.component.less']
})
export class SudokuGridComponent {

  sudokuData: SudokuCellState[][];

  range = range;

  algorithmLevels: ((sudokuData: SudokuCellState[][]) => SudokuActionResult)[] = [
    this.setCellValuesIfOnly1Possibility.bind(this)
  ];

  ngOnInit(){
    this.sudokuData = this.initSudokuGrid(9);
  }

  possibilityClicked(rowIndex: number, colIndex: number, value: number){
    this.sudokuData = this.setCellValue(this.sudokuData, rowIndex, colIndex, value);

    this.sudokuData = this.tryToSolve(this.sudokuData);
  }

  private tryToSolve(sudokuData: SudokuCellState[][]): SudokuCellState[][]{
    let tryAgain: boolean = true;
    let tmpSudokuData: SudokuCellState[][] = sudokuData;
    let algorithmLevel: number = 0;

    while(tryAgain){
      tryAgain = false;
      const actionResult: SudokuActionResult = this.algorithmLevels[algorithmLevel](tmpSudokuData);

      if(actionResult.anyChanges){
        // Ok, we found a number, start checks again from first algorithm level
        tryAgain = true;
        algorithmLevel = 0;
        tmpSudokuData = actionResult.sudokuData;
      } else if(this.algorithmLevels.length>algorithmLevel+1){
        // We didn't find a number, but maybe things will be better with the next algorithm level.
        tryAgain = true;
        algorithmLevel++;
      }
      // else: We didn't guess a number and we ran out of algorithm levels. Let's admit defeat and call it a day
    }

    return tmpSudokuData;
  }

  private initSudokuGrid<T>(dimension: number): SudokuCellState[][]{
    return range(dimension).map(rowNum=>range(dimension).map(colNum=>({possibilities: range(dimension).map(x=>x+1)})));
  }

  private setCellValue(sudokuData: SudokuCellState[][], rowIndex: number, colIndex: number, value: number): SudokuCellState[][]{
    return sudokuData.map((row, rowNum)=>row.map((cell, colNum)=>{
      if(rowNum===rowIndex && colNum === colIndex){
        return {
          value,
          possibilities: [],
        };
      } else if(rowNum===rowIndex || colNum === colIndex || (Math.floor(rowNum/3) === Math.floor(rowIndex/3) && Math.floor(colNum/3) === Math.floor(colIndex/3))){
        return this.removePossibility(cell, value);
      } else{
        return cell;
      }
    }));
  }

  private removePossibility(cellState: SudokuCellState, possibility: number): SudokuCellState{
    return {
      ...cellState,
      possibilities: cellState.possibilities.filter(p=>p!==possibility)
    };
  }

  private setCellValuesIfOnly1Possibility(sudokuData: SudokuCellState[][]): SudokuActionResult{
    let anyChanges: boolean = false;

    outer: for(let rowNum=0;rowNum<sudokuData.length;rowNum++){
      for(let colNum=0;colNum<sudokuData[rowNum].length;colNum++){
        if(sudokuData[rowNum][colNum].possibilities.length===1){
          sudokuData = this.setCellValue(sudokuData, rowNum, colNum, sudokuData[rowNum][colNum].possibilities[0]);
          anyChanges = true;
          break outer;
        }
      }
    }

    return {sudokuData, anyChanges};
  }
}
