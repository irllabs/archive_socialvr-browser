import { BaseElement } from 'data/scene/entities/baseElement';

export class Link extends BaseElement {

  private _body: string;

  constructor() {
    super();
  }

  get body(): string {
    return this._body;
  }

  set body(body) {
    this._body = body;
  }

  toJson() {
    return Object.assign(super.toJson(), {
      file: this._body,
    });
  }

}
