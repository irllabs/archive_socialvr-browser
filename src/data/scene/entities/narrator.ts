// import {BaseElement} from 'data/scene/entities/baseElement';
import {MediaFile} from 'data/scene/entities/mediaFile';
import {Vector2} from 'data/scene/entities/vector2';
import {DEFAULT_VOLUME} from 'ui/common/constants';

export class Narrator {

	private introAudio = new MediaFile();
	private returnAudio = new MediaFile();
	private volume: number = DEFAULT_VOLUME;
	//private outgoingRoomId = '';

	getIntroAudio(): MediaFile {
		return this.introAudio;
	}

	setIntroAudio(fileName, volume, dataUri) {
		this.introAudio.setFileName(fileName);
		this.introAudio.setBinaryFileData(dataUri);
		this.setVolume(volume);
	}

	getReturnAudio(): MediaFile {
		return this.returnAudio;
	}

	setReturnAudio(fileName, dataUri) {
		this.returnAudio.setFileName(fileName);
		this.returnAudio.setBinaryFileData(dataUri);
	}

	removeIntroAudio() {
		this.introAudio = new MediaFile();
	}

	// setOutgoingRoomId(outgoingRoomId: string) {
	// 	this.outgoingRoomId = outgoingRoomId;
	// }

	// getOutgoingRoomId(): string {
	// 	return this.outgoingRoomId;
	// }

	setVolume(volume: number) {
		if (volume === undefined || volume === null) {
			this.volume = DEFAULT_VOLUME
		}
		else {
			this.volume = volume
		}
	}

	getVolume(): number {
		return this.volume;
	}

	toJson() {
		return {
			intro: this.introAudio.getFileName() ? encodeURIComponent(this.introAudio.getFileName()) : '',
  			reprise: this.returnAudio.getFileName() ? encodeURIComponent(this.returnAudio.getFileName()) : '',
  			volume: this.getVolume()
      		// outgoingRoomId: this.outgoingRoomId
		};
	}

}
