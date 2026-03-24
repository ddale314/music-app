export const BAND_HEIGHT = 30;
export const NOTES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

export function indexToNote(idx) {
	let note = NOTES[idx % 12];
	let octave = Math.floor((idx + 9) / 12); // indexed from A0, C1 corresponds to range.min of 3, so add 9
	return note + octave;
}

export function getRangeAsArray(range) {
	let arr = [];
	for (let i = range.min + range.size; i >= range.min; i--) {
		arr.push(indexToNote(i));
	}
	return arr;
}
