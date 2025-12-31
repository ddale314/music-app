import styles from '../styles/editor.module.css';

export class Track {
	constructor(id, audioSegments=[]) {
		this.id = id;
		this.audioSegments = audioSegments;
	}

	addAudioSegment(newSegment) {
		this.audioSegments.push(newSegment);
	}

	removeAudioSegment(segment) {
		this.audioSegments = this.audioSegments.filter(item => item.id != segment.id);
	}

	setID(newID) {
		this.id = newID;
	}

	// returns the audiosegment which the time given by pos is contained in, if any
	containing(pos) {
		for (let i = 0; i < this.audioSegments.length; i++) {
			let seg = this.audioSegments[i];
			if (pos >= seg.start && pos <= seg.stop) {
				return seg;
			}
		}
	}

	copy() {
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