import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
  name: 'urlSanitize'
})
export class UrlSanitizePipe implements PipeTransform {

  constructor(private _sanitizer: DomSanitizer){}

  transform(value: any): any {
    return this._sanitizer.bypassSecurityTrustUrl(value);
  }

}