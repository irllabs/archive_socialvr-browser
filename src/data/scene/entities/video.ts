import {BaseElement} from 'data/scene/entities/baseElement';

export class Video extends BaseElement {

    private _body: string;
    private _isValid: boolean;
    private _validateRegexp: RegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;

    constructor() {
        super();
    }

    get isValid(): boolean {
        return this._isValid;
    }

    get body(): string {
        return this._body;
    }

    set body(body) {
        this._isValid = this.validateYouTubeUrl(body);
        this._body = body;
    }

    validateYouTubeUrl(url) {
        const match = url && url.match(this._validateRegexp);

        return match && match[2].legth === 11;
    }

    toJson() {
        return Object.assign(super.toJson(), {
            file: this._body
        });
    }
}
