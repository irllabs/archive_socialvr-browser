// Social VR Controls: A slimmed down version of OrbitControls
// https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/OrbitControls.js

// Differences include:
//  - Removing dollying & zooming
//  - Hard coding rotation speed
//  - Adding momentum

const defaultExecutionContext = (fn) => {
	if (fn && typeof fn === 'function') {
		fn();
	}
};

// THREE.SvrControls = function (camera, domElement, initialTarget) {
THREE.SvrControls = function (options) {

	// this.camera = camera;
	this.camera = options.camera;
	// this.domElement = ( domElement !== undefined ) ? domElement : document;
	// this.domElement = (options.domElement !== undefined) ? options.domElement : document;
	this.domElement = options.domElement ? options.domElement : document;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3(
		options.initialTarget.x || 0,
		options.initialTarget.y || 0,
		options.initialTarget.z || 0
	);

	this.onMouseDownCallback = options.onMouseDownCallback || (() => {});
	this.executionContext = options.executionContext || defaultExecutionContext;

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Rotation speed
	this.rotateSpeed = -0.3;

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.camera.position.clone();

	this.getPolarAngle = () => spherical.phi;

	this.getAzimuthalAngle = () => spherical.theta;

	this.hasMomentum = () => hasMomentum;

	this.shouldRender = () => isDragging || hasMomentum;

	this.reset = () => {
		scope.target.copy( scope.target0 );
		scope.camera.position.copy( scope.position0 );
		scope.camera.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );
		scope.update();
	};

	this.lookAt = (targetVector) => {
		scope.target.copy( targetVector );
		scope.camera.lookAt( scope.target );
		scope.camera.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );
		scope.update();
	}

	this.update = function () {
		const offset = new THREE.Vector3();

		// camera.up is the orbit axis
		const quat = new THREE.Quaternion().setFromUnitVectors( options.camera.up, new THREE.Vector3( 0, 1, 0 ) );
		const quatInverse = quat.clone().inverse();

		const lastPosition = new THREE.Vector3();
		const lastQuaternion = new THREE.Quaternion();

		return function update() {

			const position = scope.camera.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

      if (hasMomentum) {
        if (Math.abs(momentum.x) < momentumEpsilon && Math.abs(momentum.y) < momentumEpsilon) {
    			hasMomentum = false;
    		}
        else {
          momentum.x *= dampingFactor;
          momentum.y *= dampingFactor;
      		sphericalDelta.theta += dampingDecay * momentum.x;
      		sphericalDelta.phi   += dampingDecay * momentum.y;
        }
      }

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();

			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.camera.lookAt( scope.target );

			sphericalDelta.set( 0, 0, 0 );

			return false;
		};

	}();

	this.dispose = function () {
		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
	};

	//
	// internals
	//

	const scope = this;

	const changeEvent = { type: 'change' };
	const startEvent = { type: 'start' };
	const endEvent = { type: 'end' };

	// current position in spherical coordinates
	const spherical = new THREE.Spherical();
	const sphericalDelta = new THREE.Spherical();

	let scale = 1;
	const panOffset = new THREE.Vector3();

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	let hasMomentum = false;
	let momentum = new THREE.Vector2();
	let dampingFactor = 0.9;
	let dampingDecay = 0.005;
	let momentumEpsilon = 0.25;

	let isDragging = false;

	function getAutoRotationAngle() {
		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
	}

	function getZoomScale() {
		return Math.pow( 0.95, scope.zoomSpeed );
	}

	function rotateLeft( angle ) {
		sphericalDelta.theta -= angle;
	}

	function rotateUp( angle ) {
		sphericalDelta.phi -= angle;
	}

	function onMouseDown( event ) {
		event.preventDefault();
    hasMomentum = false;
		isDragging = true;
    momentum = new THREE.Vector2();
    rotateStart.set( event.clientX, event.clientY );

		scope.executionContext(() => {
			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );
		});
		scope.dispatchEvent( startEvent );
		scope.onMouseDownCallback(event);
	}

	function onMouseMove( event ) {
		if (!isDragging) { return; }
    event.preventDefault();
		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		const element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

    if (event.movementX !== undefined && event.movementY !== undefined) {
      momentum.x = event.movementX;
      momentum.y = event.movementY;
    }

		scope.update();
	}

	function onMouseUp( event ) {
    hasMomentum = true;
		isDragging = false;

		// this.executionContext(() => {
			document.removeEventListener( 'mousemove', onMouseMove, false );
			document.removeEventListener( 'mouseup', onMouseUp, false );
		// });
		scope.dispatchEvent(endEvent);
	}

	this.executionContext(() => {
		scope.domElement.addEventListener( 'contextmenu', e => e.preventDefault(), false );
		scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	});

	// force an update at start
	this.update();
};

THREE.SvrControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.SvrControls.prototype.constructor = THREE.SvrControls;
