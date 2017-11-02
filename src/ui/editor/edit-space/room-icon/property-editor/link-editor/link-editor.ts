import {Component, Input} from '@angular/core';

import {Link} from 'data/scene/entities/link';

@Component({
  selector: 'link-editor',
  styleUrls: ['./link-editor.scss'],
  templateUrl: './link-editor.html'
})
export class LinkEditor {

  @Input() linkProperty: Link;

  private showLinkButton(): boolean {
    return !!this.linkProperty.body;
  }

  private onLinkClick() {
  	let url: string = this.linkProperty.body;
	if (!/^http[s]?:\/\//.test(url)) {
	    url = 'http://' + url;
	}
	window.open(url, '_blank');
  }

}
