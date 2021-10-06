import { isDefined } from "../helpers/common.helpers";
import { setCellValue } from "../helpers/sudoku.helpers";
import { SudokuStoreState } from "../services/sudoku-store.state";
import { SudokuActionResult } from "../types/sudoku-action-result";
import { SudokuCellState } from "../types/sudoku-cell-state";

const algorithmLevels: ((sudokuState: SudokuStoreState) => SudokuActionResult)[] = [
    setCellValuesIfOnly1Possibility,
    setCellValuesIfPossibleIn1Place,
    reductioAdAbsurdum,
    removeAbsurdPossibilities
  ];

export function tryToSolve(sudokuState: SudokuStoreState, maxAlgorithmLevel?: number): SudokuCellState[][]{
  let tryAgain: boolean = true;
  let tmpSudokuState: SudokuStoreState = sudokuState;
  let algorithmLevel: number = 0;

  while(tryAgain){
    tryAgain = false;
    const actionResult: SudokuActionResult = algorithmLevels[algorithmLevel](tmpSudokuState);

    if(actionResult.anyChanges){
      // Ok, we found a number, start checks again from first algorithm level
      tryAgain = true;
      algorithmLevel = 0;
      tmpSudokuState = {...tmpSudokuState, sudokuData: actionResult.sudokuData};
    } else if((!isDefined(maxAlgorithmLevel) || algorithmLevel<maxAlgorithmLevel) && algorithmLevels.length>algorithmLevel+1){
      // We didn't find a number, but maybe things will be better with the next algorithm level.
      tryAgain = true;
      algorithmLevel++;
    }
    // else: We didn't guess a number and we ran out of algorithm levels. Let's admit defeat and call it a day
  }

  return tmpSudokuState.sudokuData;
}

function removePossibility(cellState: SudokuCellState, possibility: number): SudokuCellState{
  return {
    ...cellState,
    possibilities: cellState.possibilities.filter(p=>p!==possibility)
  };
}

// Algorithm level 1
function setCellValuesIfOnly1Possibility(sudokuState: SudokuStoreState): SudokuActionResult{
  const cellWith1PossibleValue: SudokuCellState = sudokuState.sudokuData.flat().find(cell=>cell.possibilities.length===1);
  if(isDefined(cellWith1PossibleValue)){
    return {
      sudokuData: setCellValue(sudokuState, cellWith1PossibleValue.row, cellWith1PossibleValue.col, cellWith1PossibleValue.possibilities[0]),
      anyChanges: true
    };
  }

  return {sudokuData: sudokuState.sudokuData, anyChanges: false};
}

// Algorithm level 2
function setCellValuesIfPossibleIn1Place(sudokuState: SudokuStoreState): SudokuActionResult{
  let distinctCellsGroup: SudokuCellState[];
  let valuePossibleIn1Place: number|undefined;

  for(let rowNum=0;rowNum<sudokuState.sudokuData.length;rowNum++){
    distinctCellsGroup = getBlankCellsInRow(sudokuState.sudokuData, rowNum);
    valuePossibleIn1Place = getValuePossibleIn1Place(distinctCellsGroup);
    if(isDefined(valuePossibleIn1Place)){
      break;
    }
  }

  if(!isDefined(valuePossibleIn1Place)){
    for(let colNum=0;colNum<sudokuState.sudokuData[0].length;colNum++){
      distinctCellsGroup = getBlankCellsInColumn(sudokuState.sudokuData, colNum);
      valuePossibleIn1Place = getValuePossibleIn1Place(distinctCellsGroup);
      if(isDefined(valuePossibleIn1Place)){
        break;
      }
    }
  }

  if(!isDefined(valuePossibleIn1Place)){
    outer: for(let rowNum=0;rowNum<sudokuState.sudokuData.length;rowNum+=sudokuState.squareHeight){
      for(let colNum=0;colNum<sudokuState.sudokuData[rowNum].length;colNum+=sudokuState.squareWidth){
        distinctCellsGroup = getBlankCellsInSquare(sudokuState, rowNum, colNum);
        valuePossibleIn1Place = getValuePossibleIn1Place(distinctCellsGroup);
        if(isDefined(valuePossibleIn1Place)){
          break outer;
        }
      }
    }
  }

  if(isDefined(valuePossibleIn1Place)){
    const cell: SudokuCellState = distinctCellsGroup.find(cell=>cell.possibilities.includes(valuePossibleIn1Place));
    return {
      sudokuData: setCellValue(sudokuState, cell.row, cell.col, valuePossibleIn1Place),
      anyChanges: true
    };
  }

  return {sudokuData: sudokuState.sudokuData, anyChanges: false};
}

function getValuePossibleIn1Place(distinctCellsGroup: SudokuCellState[]): number|undefined {
  const possibilitiesSummary: { [key: number]: number; } = summarizePossibilities(distinctCellsGroup);

  const value: string | undefined = Object.entries(possibilitiesSummary).find(([possibility, count]) => count === 1)?.[0];
  return isDefined(value)?parseInt(value):undefined;
}

function getBlankCellsInRow(sudokuData: SudokuCellState[][], rowNum: number): SudokuCellState[] {
  return sudokuData[rowNum].filter(cell=>!cell.value);
}

function getBlankCellsInColumn(sudokuData: SudokuCellState[][], colNum: number): SudokuCellState[] {
  return sudokuData.map(row=>row[colNum]).filter(cell=>!cell.value);
}

function getBlankCellsInSquare(sudokuState: SudokuStoreState, startRowNum: number, startColNum: number): SudokuCellState[] {
  return sudokuState.sudokuData
    .filter((row, rowNum)=>rowNum>=startRowNum && rowNum<startRowNum+sudokuState.squareHeight)
    .map(row=>row
      .filter((col, colNum)=>colNum>=startColNum && colNum<startColNum+sudokuState.squareWidth)
    ).flat().filter(cell=>!cell.value);
}

function summarizePossibilities(cells: SudokuCellState[]): { [key: number]: number } {
  return cells.reduce(addPossibilitiesToSum, {});
}

function addPossibilitiesToSum(possibilitySum: { [key: number]: number }, cell: SudokuCellState): { [key: number]: number }{
  return cell.possibilities.reduce(addPossibilityToSum, possibilitySum)
}

function addPossibilityToSum(possibilitySum: { [key: number]: number }, possibility: number): { [key: number]: number }{
  possibilitySum[possibility] = (possibilitySum[possibility]||0)+1
  return possibilitySum;
}

/*function addPossibilityToSum(possibilitySum: { [key: number]: number }, possibility: number): { [key: number]: number }{
  return {
    ...possibilitySum,
    [possibility]: (possibilitySum[possibility]||0)+1
  };
}*/

// Algorithm level 3
function reductioAdAbsurdum(sudokuState: SudokuStoreState): SudokuActionResult{
  const cellsWith2PossibleValues = sudokuState.sudokuData.flat().filter(cell=>cell.possibilities.length===2);
  for(let cell of cellsWith2PossibleValues){
    const correctness0: boolean = isPossibilityCorrect(sudokuState, cell, cell.possibilities[0], 1);
    const correctness1: boolean = isPossibilityCorrect(sudokuState, cell, cell.possibilities[1], 1);

    if(/*correctness0 === true || */correctness1 === false){
      return {
        sudokuData: setCellValue(sudokuState, cell.row, cell.col, cell.possibilities[0]),
        anyChanges: true
      };
    } else if(correctness0 === false/* || correctness1 === true*/){
      return {
        sudokuData: setCellValue(sudokuState, cell.row, cell.col, cell.possibilities[1]),
        anyChanges: true
      };
    }
  }

  return {sudokuData: sudokuState.sudokuData, anyChanges: false};
}

function isPossibilityCorrect(sudokuState: SudokuStoreState, cell: SudokuCellState, possibleValue: number, maxAlgorithmLevel: number): boolean|undefined {
  let dataAfterChange: SudokuCellState[][] = setCellValue(sudokuState, cell.row, cell.col, possibleValue);
  dataAfterChange = tryToSolve({...sudokuState, sudokuData: dataAfterChange}, maxAlgorithmLevel);

  if(dataAfterChange.flat().some(cell => !isDefined(cell.value) && cell.possibilities.length === 0)){
    return false;
  } else if(dataAfterChange.flat().every(cell => isDefined(cell.value))){
    return true;
  }

  return undefined;
}

// Algorithm level 4
function removeAbsurdPossibilities(sudokuState: SudokuStoreState): SudokuActionResult{
  const cellsWithMultiplePossibleValues = sudokuState.sudokuData.flat().filter(cell=>cell.possibilities.length>2).sort(compareByPossibilityCount);
  for(let cellToCheck of cellsWithMultiplePossibleValues){
    for(let possibleValue of cellToCheck.possibilities){
      const isCorrect: boolean = isPossibilityCorrect(sudokuState, cellToCheck, possibleValue, 2);

      /*if(isCorrect===true){
        return {
          sudokuData: setCellValue(sudokuData, cellToCheck.row, cellToCheck.col, possibleValue),
          anyChanges: true
        };
      } else */if(isCorrect===false){
        return {
          sudokuData: sudokuState.sudokuData.map((row)=>row.map((cell)=>{
            if(cell.row===cellToCheck.row && cell.col === cellToCheck.col){
              return removePossibility(cell, possibleValue);
            } else{
              return cell;
            }
          })),
          anyChanges: true
        };
      }
    }
  }

  return {sudokuData: sudokuState.sudokuData, anyChanges: false};
}

function compareByPossibilityCount(cell1: SudokuCellState, cell2: SudokuCellState): number {
  return cell1.possibilities.length-cell2.possibilities.length;
}