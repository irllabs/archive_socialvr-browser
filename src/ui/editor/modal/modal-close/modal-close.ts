import {Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'modal-close',
  styleUrls: ['./modal-close.scss'],
  templateUrl: './modal-close.html',
})
export class ModalClose {

  constructor(private router: Router) {}

  private onClose($event) {
    // TODO: get current view
    this.router.navigate(['/editor', {outlets: {'modal': ''}}]);
  }

}
