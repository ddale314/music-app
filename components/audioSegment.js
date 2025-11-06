import { useRef } from 'react';

export default function AudioSegment({ url }) {
	return (
		<audio controls={true} src={url}></audio>
	)
}