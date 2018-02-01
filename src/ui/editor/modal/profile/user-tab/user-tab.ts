import {Component, ViewEncapsulation, ElementRef} from '@angular/core';
import {BaseModal} from 'ui/editor/modal/base-modal';
import {UserInteractor} from 'core/user/userInteractor';
import {Router} from '@angular/router';

@Component({
  selector: 'user-tab',
  styleUrls: ['./user-tab.scss'],
  templateUrl: './user-tab.html',
  encapsulation: ViewEncapsulation.None,
  host: { '(document:click)': 'onDocumentClick($event)', }
})
export class UserTab {

  private isBeingInitialized: boolean = false;

  constructor(
    private userInteractor: UserInteractor,
    private router: Router,
    private element: ElementRef
  ) {}

  ngOnInit() {
    this.isBeingInitialized = true;
  }

  private userIsLoggedIn(): boolean {
    return this.userInteractor.isLoggedIn();
  }

  private onDocumentClick($event) {
    const isClicked: boolean = this.element.nativeElement.contains(event.target);
    // short circuit the first off click when component is being created
    if (this.isBeingInitialized) {
      this.isBeingInitialized = false;
      return;
    }
    if (!isClicked) {
      // close user modal
      this.router.navigate(['/editor', {outlets: {'modal': null}}]);
    }
  }
}
