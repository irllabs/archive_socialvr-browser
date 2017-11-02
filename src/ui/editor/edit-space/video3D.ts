
export class Video3D {

	private videoElement;
	private texture: THREE.Texture;
	private g2d;
	private editSpaceHasRendered: boolean = false;

	init(videoUrl): Promise<THREE.Texture> {
		this.videoElement = document.createElement('video');
		this.videoElement.src = videoUrl;
		this.videoElement.setAttribute('crossorigin', 'anonymous');
		this.videoElement.load();
		this.videoElement.loop = true;

		const playPromise = this.videoElement.play();
		if (playPromise) {
			return playPromise
				.then(resolve => this.initTexture())
				.catch(error => console.log('auto playback error', error));
		}
		else {
			this.initTexture();
			return Promise.resolve(this.texture);
		}
	}

	private initTexture(): THREE.Texture {
		const canvasElement = document.createElement('canvas');
		canvasElement.width = this.videoElement.videoWidth;
		canvasElement.height = this.videoElement.videoHeight;

		this.g2d = canvasElement.getContext('2d');
		this.texture = new THREE.Texture(canvasElement);
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;
		return this.texture;
	}

	getTexture(): THREE.Texture {
		return this.texture;
	}

	attemptRender(): boolean {
		if (this.videoElement.readyState !== this.videoElement.HAVE_ENOUGH_DATA) {
			return false;
		}
		this.g2d.drawImage(this.videoElement, 0, 0 );
		this.texture.needsUpdate = true;
		return true;
	}

	attemptEditSpaceRender() {
		if (!this.editSpaceHasRendered) {
			this.editSpaceHasRendered = this.attemptRender();
			this.videoElement.pause();
		}
	}

	play() {
		this.videoElement.play();
	}

	destroy() {
		this.videoElement.pause();
		this.videoElement = null;
		this.texture = null;
		this.g2d = null;
	}

}
