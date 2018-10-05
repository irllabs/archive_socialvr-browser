import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from 'data/settings/settingsService';

@Component({
  selector: 'app',
  styleUrls: ['./ui.scss'],
  templateUrl: './ui.html',
  encapsulation: ViewEncapsulation.None,
})
export class Ui {
  constructor(
    private router: Router,
    private settingsService: SettingsService,
  ) {
  }

  ngOnInit() {
    const isShared: boolean = location.hash.indexOf('sharedproject') >= 0;
    this.settingsService.setupSettings()
      
    if (!isShared) {
      this.router.navigate([{ outlets: { modal: null } }]);
    }
  }
}
