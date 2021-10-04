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
  SQUARE_HEIGHT = 2;

  algorithmLevels: ((sudokuData: SudokuCellState[][]) => SudokuActionResult)[] = [
    this.setCellValuesIfOnly1Possibility.bind(this),
    this.setCellValuesIfPossibleIn1Place.bind(this),
    this.reductioAdAbsurdum.bind(this),
    this.removeAbsurdPossibilities.bind(this)
  ];

  ngOnInit(){
    this.sudokuData = this.initSudokuGrid(this.SQUARE_WIDTH*this.SQUARE_HEIGHT);
  }

  possibilityClicked(rowIndex: number, colIndex: number, value: number){
    this.sudokuData = this.setCellValue(this.sudokuData, rowIndex, colIndex, value);

    this.sudokuData = this.tryToSolve(this.sudokuData);
  }

  private tryToSolve(sudokuData: SudokuCellState[][], maxAlgorithmLevel?: number): SudokuCellState[][]{
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
      } else if((!isDefined(maxAlgorithmLevel) || algorithmLevel<maxAlgorithmLevel) && this.algorithmLevels.length>algorithmLevel+1){
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

  // Algorithm level 1
  private setCellValuesIfOnly1Possibility(sudokuData: SudokuCellState[][]): SudokuActionResult{
    const cellWith1PossibleValue: SudokuCellState = sudokuData.flat().find(cell=>cell.possibilities.length===1);
    if(isDefined(cellWith1PossibleValue)){
      return {
        sudokuData: this.setCellValue(sudokuData, cellWith1PossibleValue.row, cellWith1PossibleValue.col, cellWith1PossibleValue.possibilities[0]),
        anyChanges: true
      };
    }

    return {sudokuData, anyChanges: false};
  }

  // Algorithm level 2
  private setCellValuesIfPossibleIn1Place(sudokuData: SudokuCellState[][]): SudokuActionResult{
    let distinctCellsGroup: SudokuCellState[];
    let valuePossibleIn1Place: number|undefined;

    for(let rowNum=0;rowNum<sudokuData.length;rowNum++){
      distinctCellsGroup = this.getBlankCellsInRow(sudokuData, rowNum);
      valuePossibleIn1Place = this.getValuePossibleIn1Place(distinctCellsGroup);
      if(isDefined(valuePossibleIn1Place)){
        break;
      }
    }

    if(!isDefined(valuePossibleIn1Place)){
      for(let colNum=0;colNum<sudokuData[0].length;colNum++){
        distinctCellsGroup = this.getBlankCellsInColumn(sudokuData, colNum);
        valuePossibleIn1Place = this.getValuePossibleIn1Place(distinctCellsGroup);
        if(isDefined(valuePossibleIn1Place)){
          break;
        }
      }
    }

    if(!isDefined(valuePossibleIn1Place)){
      outer: for(let rowNum=0;rowNum<sudokuData.length;rowNum+=this.SQUARE_HEIGHT){
        for(let colNum=0;colNum<sudokuData[rowNum].length;colNum+=this.SQUARE_WIDTH){
          distinctCellsGroup = this.getBlankCellsInSquare(sudokuData, rowNum, colNum);
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

  private getBlankCellsInRow(sudokuData: SudokuCellState[][], rowNum: number): SudokuCellState[] {
    return sudokuData[rowNum].filter(cell=>!cell.value);
  }

  private getBlankCellsInColumn(sudokuData: SudokuCellState[][], colNum: number): SudokuCellState[] {
    return sudokuData.map(row=>row[colNum]).filter(cell=>!cell.value);
  }

  private getBlankCellsInSquare(sudokuData: SudokuCellState[][], startRowNum: number, startColNum: number): SudokuCellState[] {
    return sudokuData
      .filter((row, rowNum)=>rowNum>=startRowNum && rowNum<startRowNum+this.SQUARE_HEIGHT)
      .map(row=>row
        .filter((col, colNum)=>colNum>=startColNum && colNum<startColNum+this.SQUARE_WIDTH)
      ).flat().filter(cell=>!cell.value);
  }

  private summarizePossibilities(cells: SudokuCellState[]): { [key: number]: number } {
    return cells.reduce(this.addPossibilitiesToSum.bind(this), {});
  }

  private addPossibilitiesToSum(possibilitySum: { [key: number]: number }, cell: SudokuCellState): { [key: number]: number }{
    return cell.possibilities.reduce(this.addPossibilityToSum, possibilitySum)
  }
  
  private addPossibilityToSum(possibilitySum: { [key: number]: number }, possibility: number): { [key: number]: number }{
    possibilitySum[possibility] = (possibilitySum[possibility]||0)+1
    return possibilitySum;
  }

  /*private addPossibilityToSum(possibilitySum: { [key: number]: number }, possibility: number): { [key: number]: number }{
    return {
      ...possibilitySum,
      [possibility]: (possibilitySum[possibility]||0)+1
    };
  }*/

  // Algorithm level 3
  private reductioAdAbsurdum(sudokuData: SudokuCellState[][]): SudokuActionResult{
    const cellsWith2PossibleValues = sudokuData.flat().filter(cell=>cell.possibilities.length===2);
    for(let cell of cellsWith2PossibleValues){
      const correctness0: boolean = this.isPossibilityCorrect(sudokuData, cell, cell.possibilities[0], 1);
      const correctness1: boolean = this.isPossibilityCorrect(sudokuData, cell, cell.possibilities[1], 1);

      if(/*correctness0 === true || */correctness1 === false){
        return {
          sudokuData: this.setCellValue(sudokuData, cell.row, cell.col, cell.possibilities[0]),
          anyChanges: true
        };
      } else if(correctness0 === false/* || correctness1 === true*/){
        return {
          sudokuData: this.setCellValue(sudokuData, cell.row, cell.col, cell.possibilities[1]),
          anyChanges: true
        };
      }
    }

    return {sudokuData, anyChanges: false};
  }

  private isPossibilityCorrect(sudokuData: SudokuCellState[][], cell: SudokuCellState, possibleValue: number, maxAlgorithmLevel: number): boolean|undefined {
    let dataAfterChange: SudokuCellState[][] = this.setCellValue(sudokuData, cell.row, cell.col, possibleValue);
    dataAfterChange = this.tryToSolve(dataAfterChange, maxAlgorithmLevel);

    if(dataAfterChange.flat().some(cell => !isDefined(cell.value) && cell.possibilities.length === 0)){
      return false;
    } else if(dataAfterChange.flat().every(cell => isDefined(cell.value))){
      return true;
    }

    return undefined;
  }

  // Algorithm level 4
  private removeAbsurdPossibilities(sudokuData: SudokuCellState[][]): SudokuActionResult{
    const cellsWithMultiplePossibleValues = sudokuData.flat().filter(cell=>cell.possibilities.length>2).sort(this.compareByPossibilityCount);
    for(let cellToCheck of cellsWithMultiplePossibleValues){
      for(let possibleValue of cellToCheck.possibilities){
        const isCorrect: boolean = this.isPossibilityCorrect(sudokuData, cellToCheck, possibleValue, 2);

        /*if(isCorrect===true){
          return {
            sudokuData: this.setCellValue(sudokuData, cellToCheck.row, cellToCheck.col, possibleValue),
            anyChanges: true
          };
        } else */if(isCorrect===false){
          return {
            sudokuData: sudokuData.map((row)=>row.map((cell)=>{
              if(cell.row===cellToCheck.row && cell.col === cellToCheck.col){
                return this.removePossibility(cell, possibleValue);
              } else{
                return cell;
              }
            })),
            anyChanges: true
          };
        }
      }
    }

    return {sudokuData, anyChanges: false};
  }

  private compareByPossibilityCount(cell1: SudokuCellState, cell2: SudokuCellState): number {
    return cell1.possibilities.length-cell2.possibilities.length;
  }

}
