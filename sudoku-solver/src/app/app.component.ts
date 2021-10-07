import { Component, OnInit } from '@angular/core';
import { SudokuStore } from './services/sudoku.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit {
  SQUARE_WIDTH = 3;
  SQUARE_HEIGHT = 3;

  store: SudokuStore;

  ngOnInit(){
    this.store = new SudokuStore(this.SQUARE_WIDTH, this.SQUARE_HEIGHT);
  }
}
