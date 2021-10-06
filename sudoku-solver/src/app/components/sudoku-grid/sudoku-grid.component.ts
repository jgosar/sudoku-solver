import { Component, EventEmitter, Input, Output } from '@angular/core';
import { range } from 'src/app/helpers/array.helpers';
import { SudokuCellState } from 'src/app/types/sudoku-cell-state';
import { SudokuChangeAction } from 'src/app/types/sudoku-change-action';

@Component({
  selector: 'sus-sudoku-grid',
  templateUrl: './sudoku-grid.component.html',
  styleUrls: ['./sudoku-grid.component.less']
})
export class SudokuGridComponent {
  @Input()
  squareWidth: number = 3;
  @Input()
  squareHeight: number = 3;
  @Input()
  sudokuData: SudokuCellState[][];
  @Output()
  possibilityClick: EventEmitter<SudokuChangeAction> = new EventEmitter<SudokuChangeAction>();

  range = range;

  possibilityClicked(rowIndex: number, colIndex: number, value: number){
    this.possibilityClick.emit({
      rowIndex, colIndex, setValue: value
    });
  }
}
