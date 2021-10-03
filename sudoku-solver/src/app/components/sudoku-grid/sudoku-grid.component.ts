import { Component } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { range } from 'src/app/helpers/array.helpers';
import { SudokuCellState } from 'src/app/types/sudoku-cell-state';

@Component({
  selector: 'sus-sudoku-grid',
  templateUrl: './sudoku-grid.component.html',
  styleUrls: ['./sudoku-grid.component.less']
})
export class SudokuGridComponent {

  sudokuData: SudokuCellState[][];

  range = range;

  ngOnInit(){
    this.sudokuData = this.initSudokuGrid(9);
  }

  setCellValue(rowIndex, colIndex, value){
    this.sudokuData = this.sudokuData.map((row, rowNum)=>row.map((cell, colNum)=>{
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

  private initSudokuGrid<T>(dimension: number): SudokuCellState[][]{
    return range(dimension).map(rowNum=>range(dimension).map(colNum=>({possibilities: range(dimension).map(x=>x+1)})));
  }

  private removePossibility(cellState: SudokuCellState, possibility: number): SudokuCellState{
    return {
      ...cellState,
      possibilities: cellState.possibilities.filter(p=>p!==possibility)
    };
  }
}
