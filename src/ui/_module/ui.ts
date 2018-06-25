import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app',
  styleUrls: ['./ui.scss'],
  templateUrl: './ui.html',
  encapsulation: ViewEncapsulation.None,
})
export class Ui {
  constructor(
    private router: Router,
  ) {
  }

  ngOnInit() {
    const isShared: boolean = location.hash.indexOf('sharedproject') >= 0;

    if (!isShared) {
      this.router.navigate([{ outlets: { modal: null } }]);
    }
  }
}
