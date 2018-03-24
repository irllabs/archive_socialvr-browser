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

### Deploy
At the moment, deployments are manual. These scripts will deploy whatever is in your current directory so it is important to be careful.

* Deploy to staging: ```npm run deploy```
* Deploy to production:
```sh
npm run build:prod;
# Make sure it built: ls -al ./dist;
# copy to prod server
scp -r ./dist/* irlab@irl.studio:/home/irlab/socialvr.irl.studio;
```
Note that `npm run deploy` and `npm build:prod` build the project in different ways.
* `npm run deploy` points to the staging API server
* `npm run buil:prod` points to the production API server. Also, it minifies all the JavaScript so the project can move to the browser quicker.

##### Extra safe prod deployment (deploy what is currently in master)
```sh
#!/bin/bash

# clone single branch of repo without history
git clone --depth 1 --branch master git@github.com:cmuartfab/socialvr-browser.git;

# move into cloned repo
cd socialvr-browser;

# install dependencies
npm install;

# build project
npm run build:prod;

# ls -al ./dist;

# copy to prod server
scp -r ./dist/* irlab@irl.studio:/home/irlab/socialvr.irl.studio;
```

### Architecture
* CLEAN, or "layered" architecture as described [here](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html).
* We have three layers, from outside in they are: "UI", "Core", and "Data".  The UI layer is split into two sub-layers: "view" and "presentation".
* The "view" is the markup for a UI component. This layer should only be responsible for getting / setting primitive types, and simple view logic (conditionally hiding or showing, and repeating over elements).
* The "presentation" layer is the TypeScript class for a component.  This layer should be responsible for providing data to the view, and acting on click events. Complex view logic should also be in the presentation layer.
* The "Core" layer provides use-cases.  This layer should provide methods to the presenter so that it can interact with data.
* The "Data" layer holds application state and interfaces with network and disk storage.
