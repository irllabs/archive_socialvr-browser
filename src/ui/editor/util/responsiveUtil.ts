import {Injectable} from '@angular/core';

@Injectable()
export class ResponsiveUtil {

  private screenWidth: number;

  constructor() {
    this.screenWidth = window.innerWidth;
    window.addEventListener('resize', $event => this.screenWidth = window.innerWidth);
  }

  isMobile() {
    return this.screenWidth < 768; // this must match values in breakpoints.scss
  }

}
