// Social VR Controls: A slimmed down version of OrbitControls
// https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/OrbitControls.js

// Differences include:
//  - Removing dollying & zooming
//  - Hard coding rotation speed
//  - Adding momentum

THREE.SvrControls = function (object, domElement, initialTarget) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3(
		initialTarget.x || 0,
		initialTarget.y || 0,
		initialTarget.z || 0
	);

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
	this.position0 = this.object.position.clone();

	this.getPolarAngle = function () {
		return spherical.phi;
	};

	this.getAzimuthalAngle = function () {
		return spherical.theta;
	};

	this.hasMomentum = function () {
		return hasMomentum;
	};

	this.reset = function () {
		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );
		scope.update();
	};

	this.lookAt = function(targetVector) {
		scope.target.copy( targetVector );
		scope.object.lookAt( scope.target );
		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );
		scope.update();
	}

	this.update = function () {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {

			var position = scope.object.position;

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

			scope.object.lookAt( scope.target );

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

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var hasMomentum = false;
	var momentum = new THREE.Vector2();
	var dampingFactor = 0.9;
	var dampingDecay = 0.005;
	var momentumEpsilon = 0.25;


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
    momentum = new THREE.Vector2();
    rotateStart.set( event.clientX, event.clientY );
		scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( startEvent );
	}

	function onMouseMove( event ) {
    event.preventDefault();
		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

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
    scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( endEvent );
	}

	function onContextMenu( event ) {
		event.preventDefault();
	}

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );
	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );

	// force an update at start
	this.update();
};

THREE.SvrControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.SvrControls.prototype.constructor = THREE.SvrControls;
