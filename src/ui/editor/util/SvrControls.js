// Social VR Controls: A slimmed down version of OrbitControls
// https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/OrbitControls.js

// Differences include:
//  - Removing dollying & zooming
//  - Hard coding rotation speed
//  - Adding momentum

const TWO_PI = 2 * Math.PI;
const ROTATE_SPEED = -0.3;
const DAMPING_FACTOR = 0.9;
const DAMPING_DECAY = 0.005;
const MOMENTUM_EPSILON = 0.25;
const START_EVENT = { type: 'start' };
const END_EVENT = { type: 'end' };

const defaultExecutionContext = (fn) => {
	if (fn && typeof fn === 'function') {
		fn();
	}
};

THREE.SvrControls = function (options) {

	// this.camera = camera;
	this.camera = options.camera;
	this.domElement = options.domElement ? options.domElement : document;
	this.target = new THREE.Vector3();
	this.onMouseDownCallback = options.onMouseDownCallback || (() => {});
	this.executionContext = options.executionContext || defaultExecutionContext;

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.camera.position.clone();

	this.getCameraAngles = () => spherical;

	this.setCameraAngles = (phi, theta) => {
		spherical.phi = phi;
		spherical.theta = theta;

		const position = scope.camera.position;
		const quat = new THREE.Quaternion().setFromUnitVectors(options.camera.up, new THREE.Vector3(0, 1, 0));
		const quatInverse = quat.clone().inverse();
		const offset = new THREE.Vector3().setFromSpherical(spherical);
		offset.applyQuaternion(quatInverse);
		position.copy(scope.target).add(offset);
		scope.camera.lookAt(scope.target);
	};

	this.hasMomentum = () => hasMomentum;

	this.shouldRender = () => isDragging || hasMomentum;

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
        if (Math.abs(momentum.x) < MOMENTUM_EPSILON && Math.abs(momentum.y) < MOMENTUM_EPSILON) {
    			hasMomentum = false;
    		}
        else {
          momentum.x *= DAMPING_FACTOR;
          momentum.y *= DAMPING_FACTOR;
      		sphericalDelta.theta += DAMPING_DECAY * momentum.x;
      		sphericalDelta.phi += DAMPING_DECAY * momentum.y;
        }
      }

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			spherical.makeSafe();

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.camera.lookAt( scope.target );

			sphericalDelta.set( 0, 0, 0 );
		};

	}();

	this.dispose = function () {
		scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
		scope.domElement.removeEventListener('mousedown', onMouseDown, false);
		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);
		scope.domElement.removeEventListener('touchstart', onTouchStart, false);
		document.removeEventListener('touchmove', onTouchMove, false);
		document.removeEventListener('touchend', onTouchEnd, false);
	};

	//
	// internals
	//

	const scope = this;
	const spherical = new THREE.Spherical();
	const sphericalDelta = new THREE.Spherical();
	const rotateStart = new THREE.Vector2();
	const rotateEnd = new THREE.Vector2();
	const rotateDelta = new THREE.Vector2();
	const touchLocation = new THREE.Vector2(0, 0);

	let hasMomentum = false;
	let momentum = new THREE.Vector2();
	let isDragging = false;

	function getAutoRotationAngle() {
		return TWO_PI / 60 / 60 * scope.autoRotateSpeed;
	}

	function rotateLeft( angle ) {
		sphericalDelta.theta -= angle;
	}

	function rotateUp( angle ) {
		sphericalDelta.phi -= angle;
	}

	function onMouseDown(event) {
		event.preventDefault();
    hasMomentum = false;
		isDragging = true;
    momentum = new THREE.Vector2();
    rotateStart.set(event.clientX, event.clientY);

		scope.executionContext(() => {
			document.addEventListener('mousemove', onMouseMove, false);
			document.addEventListener('mouseup', onMouseUp, false);
			document.addEventListener('touchmove', onTouchMove, { passive: false });
			document.addEventListener('touchend', onTouchEnd, false);
		});
		scope.dispatchEvent(START_EVENT);
		scope.onMouseDownCallback(event);
	}

	function onMouseMove( event ) {
		if (!isDragging) { return; }
    event.preventDefault();
		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors(rotateEnd, rotateStart);

		const element = scope.domElement === document ? scope.domElement.body : scope.domElement;
		rotateLeft(TWO_PI * rotateDelta.x / element.clientWidth * ROTATE_SPEED);
		rotateUp(TWO_PI * rotateDelta.y / element.clientHeight * ROTATE_SPEED);
		rotateStart.copy(rotateEnd);

    if (event.movementX !== undefined && event.movementY !== undefined) {
      momentum.x = event.movementX;
      momentum.y = event.movementY;
    }

		scope.update();
	}

	function onMouseUp( event ) {
    hasMomentum = true;
		isDragging = false;
		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);
		document.removeEventListener('touchmove', onTouchMove, false);
		document.removeEventListener('touchend', onTouchEnd, false);
		scope.dispatchEvent(END_EVENT);
	}

	function onTouchStart(event) {
		if (event.touches.length > 1) { return; }
		const x = event.touches[0].clientX;
		const y = event.touches[0].clientY;
		touchLocation.x = x;
		touchLocation.y = y;
		event.clientX = x;
		event.clientY = y;
		event.movementX = 0;
		event.movementY = 0;
		event.preventDefault = () => {};
		onMouseDown(event);
	}

	function onTouchMove(event) {
		const x = event.touches[0].clientX;
		const y = event.touches[0].clientY;
		event.clientX = x;
		event.clientY = y;
		event.movementX = x - touchLocation.x;
		event.movementY = y - touchLocation.y;
		touchLocation.x = x;
		touchLocation.y = y;
		onMouseMove(event);
	}

	function onTouchEnd(event) {
		if (event.touches.length > 0) { return; }
		event.clientX = touchLocation.x;
		event.clientY = touchLocation.y;
		onMouseUp(event);
	}

	this.executionContext(() => {
		scope.domElement.addEventListener('contextmenu', e => e.preventDefault(), false);
		scope.domElement.addEventListener('mousedown', onMouseDown, false);
		scope.domElement.addEventListener('touchstart', onTouchStart, false);
	});

	// initialize
	this.update();
	if (options.initialCameraAngles) {
		const { phi, theta } = options.initialCameraAngles;
		this.setCameraAngles(phi, theta);
	}
};

THREE.SvrControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.SvrControls.prototype.constructor = THREE.SvrControls;
