import {Component} from '@angular/core';
import {ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app',
  styleUrls: ['./ui.scss'],
  templateUrl: './ui.html',
  encapsulation: ViewEncapsulation.None
})
export class Ui {
  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    this.router.navigate([{ outlets: { modal: null }}]);
  }
}
