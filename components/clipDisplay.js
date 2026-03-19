import { useRef } from 'react';
import styles from '../styles/editor.module.css';
import Ruler from '../components/ruler';
import { TrackComponent } from '../components/track';

export default function ClipDisplay({ components, width, height, rulerSettings, type, asComp = null, selected = null, playhead = null, range = null, addNote = null }) {
	const editorScrollRef = useRef(null);

	function rulerStyle(height) {
		let style = {
			width: "10000px",
			height: height,
			backgroundImage: "linear-gradient(to right, var(--daw-border) 1px, transparent 1px)",
			backgroundRepeat: "repeat-x",
			backgroundSize: `${rulerSettings.width * rulerSettings.gap * (rulerSettings.sig[0] / rulerSettings.sig[1])}px 100px`,
			backgroundPosition: "0 0"
		}
		return style;
	}

	function handleRightClick(e) {
		e.preventDefault();
		const rect = e.currentTarget.getBoundingClientRect();
		let pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
		addNote(pos);
	}

	let sidebar;

	if (type == "recordingCanvas") {
		sidebar = <div className={styles.trackLabel}>
			{
				components.map((comp) => {
					return (
						<button
							key={comp.id}
							onClick={() => selected.setSelectedTrack(comp.id)}
							className={selected.selectedTrack == comp.id ? styles.trackLabelButtonActive : styles.trackLabelButton}
						>
							Track {comp.id}
						</button>
					);
				})
			}
		</div>
	}
	else {
		sidebar = <div className={styles.trackLabel}>
			{
				range.map((item, index) => {
					return (
						<div key={index} className={styles.trackLabelButton} style={{ height: "30px", paddingLeft: "12px" }}>
							{item}
						</div>
					);
				})
			}
		</div>
	}

	return (
		<div className={styles.editorContainer} ref={editorScrollRef} style={type === "segmentEditor" ? { maxHeight: "300px", height: "300px" } : { flex: 1, minHeight: 0 }}>
			<div className={styles.editorContentWrapper}>
				{sidebar}

				{type == "recordingCanvas" ?
					<div ref={playhead.ref} className={styles.editor}>
						<div className={styles.ruler}>
							<Ruler defaultWidth={rulerSettings.width} tickGap={rulerSettings.gap} tickValue={rulerSettings.sig[0]} tickUnit={rulerSettings.sig[1]} />

							{/* playhead */}
							<div style={{ userSelect: "none", position: "absolute", top: 0, left: `${playhead.pos.x}px`, width: '1px', height: '100vh', background: 'var(--daw-accent-red)', zIndex: 100 }}></div>
						</div>

						{components.map((comp) => {
							return (
								<TrackComponent key={comp.id} audioSegments={comp.audioSegments.map((item) => [asComp(item)])} rulerStyle={rulerStyle("50px")} />
							);

						})}
					</div>

					:

					<div className={styles.editor}>
						<div className={styles.ruler}>
							<Ruler defaultWidth={rulerSettings.width} tickGap={rulerSettings.gap} tickValue={rulerSettings.sig[0]} tickUnit={rulerSettings.sig[1]} />
						</div>

						<div style={{ position: "relative" }} onContextMenu={handleRightClick}>
							{range.map((item, index) => {
								return (
									<div key={index} className={styles.track} style={rulerStyle("30px")}></div>
								);
							})}
							{components.map((comp, i) => {
								return <div key={`comp-${i}`}>{comp}</div>;
							})}
						</div>
					</div>
				}
			</div>
		</div>
	);
}