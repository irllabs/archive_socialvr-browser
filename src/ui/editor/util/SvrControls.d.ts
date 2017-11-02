/// <reference types="three" />

declare namespace THREE {
    export class SvrControls {
        constructor(camera: Camera, domElement: HTMLElement, target: any);
        update(): void;
        reset(): void;
        hasMomentum(): boolean;
    }
}
