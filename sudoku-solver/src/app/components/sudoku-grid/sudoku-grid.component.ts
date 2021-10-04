import { Component } from '@angular/core';
import { range } from 'src/app/helpers/array.helpers';
import { isDefined } from 'src/app/helpers/common.helpers';
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
  SQUARE_WIDTH = 3;
  SQUARE_HEIGHT = 3;

  algorithmLevels: ((sudokuData: SudokuCellState[][]) => SudokuActionResult)[] = [
    this.setCellValuesIfOnly1Possibility.bind(this),
    this.setCellValuesIfPossibleIn1Place.bind(this)
  ];

  ngOnInit(){
    this.sudokuData = this.initSudokuGrid(this.SQUARE_WIDTH*this.SQUARE_HEIGHT);
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

  private setCellValue(sudokuData: SudokuCellState[][], rowIndex: number, colIndex: number, value: number): SudokuCellState[][]{
    return sudokuData.map((row, rowNum)=>row.map((cell, colNum)=>{
      if(rowNum===rowIndex && colNum === colIndex){
        return {
          ...sudokuData[rowNum][colNum],
          value,
          possibilities: [],
        };
      } else if(this.areCellsMutuallyExclusive(rowNum, colNum, rowIndex, colIndex)){
        return this.removePossibility(cell, value);
      } else{
        return cell;
      }
    }));
  }

  private areCellsMutuallyExclusive(row1: number, col1: number, row2: number, col2: number) {
    return row1 === row2 || col1 === col2 || this.isInSameSquare(row1, col1, row2, col2);
  }

  private isInSameSquare(row1: number, col1: number, row2: number, col2: number): boolean {
    return (Math.floor(row1 / this.SQUARE_HEIGHT) === Math.floor(row2 / this.SQUARE_HEIGHT) && Math.floor(col1 / this.SQUARE_WIDTH) === Math.floor(col2 / this.SQUARE_WIDTH));
  }

  private removePossibility(cellState: SudokuCellState, possibility: number): SudokuCellState{
    return {
      ...cellState,
      possibilities: cellState.possibilities.filter(p=>p!==possibility)
    };
  }

  private setCellValuesIfOnly1Possibility(sudokuData: SudokuCellState[][]): SudokuActionResult{
    for(let rowNum=0;rowNum<sudokuData.length;rowNum++){
      for(let colNum=0;colNum<sudokuData[rowNum].length;colNum++){
        if(sudokuData[rowNum][colNum].possibilities.length===1){
          return {
            sudokuData: this.setCellValue(sudokuData, rowNum, colNum, sudokuData[rowNum][colNum].possibilities[0]),
            anyChanges: true
          };
        }
      }
    }

    return {sudokuData, anyChanges: false};
  }

  private setCellValuesIfPossibleIn1Place(sudokuData: SudokuCellState[][]): SudokuActionResult{
    let distinctCellsGroup: SudokuCellState[];
    let valuePossibleIn1Place: number|undefined;

    for(let rowNum=0;rowNum<sudokuData.length;rowNum++){
      distinctCellsGroup = this.getCellsInRow(sudokuData, rowNum);
      valuePossibleIn1Place = this.getValuePossibleIn1Place(distinctCellsGroup);
      if(isDefined(valuePossibleIn1Place)){
        break;
      }
    }

    if(!isDefined(valuePossibleIn1Place)){
      for(let colNum=0;colNum<sudokuData[0].length;colNum++){
        distinctCellsGroup = this.getCellsInColumn(sudokuData, colNum);
        valuePossibleIn1Place = this.getValuePossibleIn1Place(distinctCellsGroup);
        if(isDefined(valuePossibleIn1Place)){
          break;
        }
      }
    }

    if(!isDefined(valuePossibleIn1Place)){
      outer: for(let rowNum=0;rowNum<sudokuData.length;rowNum+=this.SQUARE_HEIGHT){
        for(let colNum=0;colNum<sudokuData[rowNum].length;colNum+=this.SQUARE_WIDTH){
          distinctCellsGroup = this.getCellsInSquare(sudokuData, rowNum, colNum);
          valuePossibleIn1Place = this.getValuePossibleIn1Place(distinctCellsGroup);
          if(isDefined(valuePossibleIn1Place)){
            break outer;
          }
        }
      }
    }

    if(isDefined(valuePossibleIn1Place)){
      const cell: SudokuCellState = distinctCellsGroup.find(cell=>cell.possibilities.includes(valuePossibleIn1Place));
      return {
        sudokuData: this.setCellValue(sudokuData, cell.row, cell.col, valuePossibleIn1Place),
        anyChanges: true
      };
    }

    return {sudokuData, anyChanges: false};
  }

  private getValuePossibleIn1Place(distinctCellsGroup: SudokuCellState[]): number|undefined {
    const possibilitiesSummary: { [key: number]: number; } = this.summarizePossibilities(distinctCellsGroup);

    const value: string | undefined = Object.entries(possibilitiesSummary).find(([possibility, count]) => count === 1)?.[0];
    return isDefined(value)?parseInt(value):undefined;
  }

  private getCellsInRow(sudokuData: SudokuCellState[][], rowNum: number): SudokuCellState[] {
    return sudokuData[rowNum];
  }

  private getCellsInColumn(sudokuData: SudokuCellState[][], colNum: number): SudokuCellState[] {
    return sudokuData.map(row=>row[colNum]);
  }

  private getCellsInSquare(sudokuData: SudokuCellState[][], startRowNum: number, startColNum: number): SudokuCellState[] {
    return sudokuData
      .filter((row, rowNum)=>rowNum=>startRowNum && rowNum<startRowNum+this.SQUARE_HEIGHT)
      .map(row=>row
        .filter((col, colNum)=>colNum=>startColNum && colNum<startColNum+this.SQUARE_WIDTH)
      ).flat();
  }

  private summarizePossibilities(cells: SudokuCellState[]): { [key: number]: number } {
    return cells.reduce(this.addPossibilitiesToSum.bind(this), {});
  }

  private addPossibilitiesToSum(possibilitySum: { [key: number]: number }, cell: SudokuCellState): { [key: number]: number }{
    return cell.possibilities.reduce(this.addPossibilityToSum, possibilitySum)
  }

  private addPossibilityToSum(possibilitySum: { [key: number]: number }, possibility: number): { [key: number]: number }{
    return {
      ...possibilitySum,
      [possibility]: (possibilitySum[possibility]||0)+1
    };
  }
}
