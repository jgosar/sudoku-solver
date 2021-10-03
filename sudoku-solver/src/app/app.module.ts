import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SudokuGridComponent } from 'src/app/components/sudoku-grid/sudoku-grid.component';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    SudokuGridComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
