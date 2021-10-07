import { Observable, Subject } from "rxjs";
import { SudokuStoreState } from "../services/sudoku-store.state";
import { SudokuChangeAction } from "../types/sudoku-change-action";

export function tryToSolveAsync(sudokuState: SudokuStoreState): Subject<SudokuChangeAction[]>{
  const actionsSubject: Subject<SudokuChangeAction[]> = new Subject<SudokuChangeAction[]>();

  const worker = new Worker('./sudoku-solver.worker', { type: 'module' });
  worker.onmessage = ({ data }) => {
    actionsSubject.next(data);
  };
  worker.postMessage(sudokuState);

  return actionsSubject;
}
