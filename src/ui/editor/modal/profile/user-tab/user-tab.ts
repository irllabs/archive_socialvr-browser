import { Component, ElementRef, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UserInteractor } from 'core/user/userInteractor';

@Component({
  selector: 'user-tab',
  styleUrls: ['./user-tab.scss'],
  templateUrl: './user-tab.html',
  encapsulation: ViewEncapsulation.None,
})
export class UserTab implements OnInit {
  private isBeingInstantiated: boolean = false;

  constructor(
    private userInteractor: UserInteractor,
    private router: Router,
    private element: ElementRef,
  ) {
  }

  ngOnInit() {
    this.isBeingInstantiated = true;
  }

  @HostListener('document:click', ['$event'])
  private onDocumentClick($event) {
    const isClicked: boolean = this.element.nativeElement.contains($event.target);
    // short circuit the first off click when component is being created
    if (this.isBeingInstantiated) {
      this.isBeingInstantiated = false;
      return;
    }
    if (!isClicked) {
      // close user modal
      this.router.navigate(['/editor', { outlets: { 'modal': null } }]);
    }
  }

  public userIsLoggedIn(): boolean {
    return this.userInteractor.isLoggedIn();
  }
}
