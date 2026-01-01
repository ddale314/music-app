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
export default function ClipDisplay({ components, width, height, rulerSettings, type, asComp=null, selected=null, playhead=null, range=null, addNote=null }) {
	const editorScrollRef = useRef(null);

	function rulerStyle(height) {
		let style =  {
			// make this width scale with the maximum audio segment length, or cap recording at certain length
			width: "200%",
			height: height,

			backgroundImage: "linear-gradient(90deg, rgb(0, 0, 0) 0 1px, transparent 0)",
			
			backgroundRepeat: "repeat-x",
			backgroundSize: `${rulerSettings.width * rulerSettings.gap * (rulerSettings.sig[0] / rulerSettings.sig[1])}px 100px`
		}
		return style;
	}

	function handleRightClick(e) {
		const topOffset = 550;
		e.preventDefault();
		const rect = e.target.getBoundingClientRect();
		let pos = {x: e.pageX - rect.left, y: e.pageY-topOffset+editorScrollRef.current.scrollTop};
		addNote(pos);
		console.log(pos);
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
						range.map((item) => {
								return (
									<div style={{height: "30px"}}>{item}</div>
								);  
						})
					}
				</div>
	}

	return (
		<div className={styles.editorContainer} ref={editorScrollRef}>
			
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
							<TrackComponent audioSegments={comp.audioSegments.map((item) => [asComp(item)])} rulerStyle={rulerStyle("50px")}/>
						); 
							
					})}
				</div>

				:

				<div className={styles.editor} style={{width: `${width}px`, height: `${height}px`}}>
					<div className={styles.ruler}>
						<Ruler defaultWidth={rulerSettings.width} tickGap={rulerSettings.gap} tickValue={rulerSettings.sig[0]} tickUnit={rulerSettings.sig[1]}/> 
					</div>

					<div style={{position: "relative"}} onContextMenu={handleRightClick}>
						{range.map( () => {
							return (
								<div className={styles.track} style={rulerStyle("30px")}></div>
							); 	
						})}
						{components.map( (comp) => {
							return comp;
						})}
					</div>
				</div>
			}
		</div>
	);
}