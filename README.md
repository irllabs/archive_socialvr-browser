## Social VR Editing Tool

### About
Browser based editor tool for the Social VR project.

### Tools Used
* Angular 2 - application framework
* TypeScript - a strictly typed superset of JavaScript.
* SCSS - a superset of CSS that allows imports, variables, and more.
* PostCss - obviates the need for vendor prefixes in CSS files.
* WebPack - provides JS bundling, an easy to use dev server, build options, and more.
* ThreeJS - Cross-browser 3D graphics with WebGL.

### Installation and Usage
- See [WIKI page on Browser Editor Local Build](https://github.com/cmuartfab/social-vr/wiki/Browser-Editor-Local-Build)
- See [WIKI page on CSS design instructions](https://github.com/cmuartfab/social-vr/wiki/Browser-Editor-CSS-Architecture)

### Local Builds
* Point to a locally running server: ```npm run dev-local```
* Point to the staging server: ```npm run dev```
* Point to production: ```npm run dev-prod```

### Architecture
* CLEAN, or "layered" architecture as described [here](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html).
* We have three layers, from outside in they are: "UI", "Core", and "Data".  The UI layer is split into two sub-layers: "view" and "presentation".
* The "view" is the markup for a UI component. This layer should only be responsible for getting / setting primitive types, and simple view logic (conditionally hiding or showing, and repeating over elements).
* The "presentation" layer is the TypeScript class for a component.  This layer should be responsible for providing data to the view, and acting on click events. Complex view logic should also be in the presentation layer.
* The "Core" layer provides use-cases.  This layer should provide methods to the presenter so that it can interact with data.
* The "Data" layer holds application state and interfaces with network and disk storage.
