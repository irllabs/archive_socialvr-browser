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
    } else {
      /*
       * I posted the problem that i faced to stack overflow with this
       * possible solution. If you could find any other ways to fix it,
       * please, post to thread linked below.
       *
       * https://stackoverflow.com/questions/52873169/firebase-dynamic-links-modifying-redirect-url-only-on-mobile-safari-and-chrome-i
       */
      location.href = decodeURIComponent(location.href)
    }
  }
}
