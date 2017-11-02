import {
  Component,
  EventEmitter,
  NgZone} from '@angular/core';
import {Router} from '@angular/router';

export class BaseModal {

  constructor(
    private router: Router
  ) {}

  private close() {
    this.router.navigate(['/editor', {outlets: {'modal': ''}}]);
  }

  onOffClick($event) {
    if (!$event.isOffClick) return;
    this.router.navigate(['/editor', {outlets: {'modal': ''}}]);
  }
}
