import { useRef, useState, useEffect, useCallback } from 'react';
import useRecorder from '../hooks/useRecorder';
import { AudioSegment, AudioSegmentComponent } from '../components/audioSegment';
import styles from '../styles/editor.module.css';
import Ruler from '../components/ruler';
import { Track, TrackComponent } from '../components/track';
import useDraggable from '../hooks/useDraggable';

/*
	treat elements of components as though they implement some "DrawableAudio" interface
		- either audiosegment or some representation of a note
		- ascomp converts an object representation to a jsx component
	rulerSettings: width, gap, sig
	selected, playhead are info for audiosegment case
		- selected: selectedTrack, setSelectedTrack
		- playhead: ref, pos
*/
export default function ClipDisplay({ components, width, height, rulerSettings, asComp, type, selected=null, playhead=null }) {
	const rulerStyle = {
		// make this width scale with the maximum audio segment length, or cap recording at certain length
		width: "200%",
		height: "50px",

		backgroundImage: "linear-gradient(90deg, rgb(0, 0, 0) 0 1px, transparent 0)",
		
		backgroundRepeat: "repeat-x",
		backgroundSize: `${rulerSettings.width * rulerSettings.gap * (rulerSettings.sig[0] / rulerSettings.sig[1])}px 100px`
	}

	let sidebar;

	if (type == "recordingCanvas") {
		sidebar = <div className={styles.trackLabel} style={{height: `${height-55}px`}}>
					{
						components.map((comp) => {
								return (
									<button onClick={() => selected.setSelectedTrack(comp.id)} style={{height: "50px", border: 0, backgroundColor: (selected.selectedTrack == comp.id ? "rgb(0, 255, 0)" : "rgb(255, 255, 255)")}}>track {comp.id}</button>
								);  
						})
					}
				</div>
	}
	else {
		sidebar = <div className={styles.trackLabel} style={{height: `${height-55}px`}}>
					{
						components.map((comp) => {
								return (
									<div> hi </div>
								);  
						})
					}
				</div>
	}

	return (
		<div className={styles.editorContainer}>
			
			{sidebar}
					
			{/* This appears to be fixed -> Maybe there is an issue if the size of the audio segment exceeds the size of the container? */}
			{type == "recordingCanvas" ?
				<div ref={playhead.ref} className={styles.editor} style={{width: `${width}px`, height: `${height}px`}}>
					<div className={styles.ruler}>
						<Ruler defaultWidth={rulerSettings.width} tickGap={rulerSettings.gap} tickValue={rulerSettings.sig[0]} tickUnit={rulerSettings.sig[1]}/> 

						{/* playhead */}
						<div style={{userSelect: "none", position: "absolute", top: 0, left: `${-6.5+playhead.pos.x}px`}}>{'\u2193'}</div>
						</div>
						{components.map( (comp) => {
							return (
								<TrackComponent audioSegments={comp.audioSegments.map((item) => [asComp(item)])} rulerStyle={rulerStyle}/>
							); 
								
						})}
				</div>

				:

				<div className={styles.editor} style={{width: `${width}px`, height: `${height}px`}}>
					<div className={styles.ruler}>
						<Ruler defaultWidth={rulerSettings.width} tickGap={rulerSettings.gap} tickValue={rulerSettings.sig[0]} tickUnit={rulerSettings.sig[1]}/> 
					</div>

					{components.map( (comp) => {
						return (
							asComp(comp)
						); 
							
					})}
				</div>
			}
		</div>
	);
}