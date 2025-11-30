import styles from '../styles/editor.module.css';

export class Track {
	constructor(id, audioSegments=[]) {
		this.id = id;
		this.audioSegments = audioSegments;
	}

	addAudioSegment(newSegment) {
		this.audioSegments.push(newSegment);
		console.log("added: ", this.audioSegments);
	}

	setID(newID) {
		this.id = newID;
	}

	copy() {
		console.log(this.audioSegments);
		for (let i = 0; i < this.audioSegments.length; i++) {
			console.log(this.audioSegments[i]);
		}
		console.log("copy: ", structuredClone(this.audioSegments));
		return new Track(this.id, [...this.audioSegments]);
	}
}

export function TrackComponent({ audioSegments, rulerStyle }) {
	return (
		<div className={styles.track} style={rulerStyle}>
			{
				audioSegments.map( (segment) => { return segment })
			}
		</div>
	);
}