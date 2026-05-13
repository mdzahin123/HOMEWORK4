import { Routes } from '@angular/router';
import {GameBoardComponent} from './components/game-board/game-board.component';
import {HomeComponent} from './components/home/home.component';
import{RulesComponent} from './components/rules/rules.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game', component: GameBoardComponent },
  { path: 'rules', component: RulesComponent },
  { path: '**', redirectTo: '' }
];
