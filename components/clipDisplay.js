import { useRef, useState, useEffect } from 'react';
import styles from '../styles/editor.module.css';
import Ruler from '../components/ruler';
import { TrackComponent } from '../components/track';

export default function ClipDisplay({ components, width, height, rulerSettings, type, asComp = null, selected = null, changeTrackVolume = null, playhead = null, range = null, addNote = null, duplicateNote = null, deleteNote = null, onSelectRegion = null, onDeselectAll = null }) {
	const editorScrollRef = useRef(null);
	const dragRef = useRef(null);
	const [contextMenu, setContextMenu] = useState(null);

	const [isDraggingBox, setIsDraggingBox] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [currentDrag, setCurrentDrag] = useState({ x: 0, y: 0 });

	useEffect(() => {
		function handleDocMouseMove(e) {
			if (!isDraggingBox || !dragRef.current) return;
			const rect = dragRef.current.getBoundingClientRect();
			setCurrentDrag({ x: e.clientX - rect.left, y: e.clientY - rect.top });
		}

		function handleDocMouseUp(e) {
			if (!isDraggingBox || !dragRef.current) return;
			setIsDraggingBox(false);

			const rect = dragRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const minX = Math.min(dragStart.x, x);
			const minY = Math.min(dragStart.y, y);
			const w = Math.abs(x - dragStart.x);
			const h = Math.abs(y - dragStart.y);

			if (w > 5 || h > 5) {
				console.log("run onselect");
				if (onSelectRegion) onSelectRegion({ x: minX, y: minY, w: w, h: h });
			}
		}

		if (isDraggingBox) {
			document.addEventListener("mousemove", handleDocMouseMove);
			document.addEventListener("mouseup", handleDocMouseUp);
			return () => {
				document.removeEventListener("mousemove", handleDocMouseMove);
				document.removeEventListener("mouseup", handleDocMouseUp);
			};
		}
	}, [isDraggingBox, dragStart, onSelectRegion]);

	useEffect(() => {
		function handleClickOutside(e) {
			// Do not clear context menu if we are clicking on the context menu itself
			if (e.target.closest('[data-context-menu]')) return;
			setContextMenu(null);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

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
		if (!addNote && !duplicateNote && !deleteNote) return;
		const rect = e.currentTarget.getBoundingClientRect();
		let pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

		let noteNode = e.target.closest('[data-note-id]');
		if (noteNode && (duplicateNote || deleteNote)) {
			let noteId = noteNode.getAttribute('data-note-id');
			setContextMenu({ type: 'note', id: parseInt(noteId), x: e.pageX, y: e.pageY, pos: pos });
		} else if (addNote) {
			setContextMenu({ type: 'bg', x: e.pageX, y: e.pageY, pos: pos });
		}
	}

	function handleMouseDownLocal(e) {
		if (e.button !== 0 || type !== "segmentEditor") return;
		if (e.target.closest('[data-note-id]')) return; // let note handle its own drag

		if (onDeselectAll) onDeselectAll();

		if (!dragRef.current) return;
		const rect = dragRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (e.target.closest(`.${styles.ruler}`)) return; // Don't drag over ruler

		setDragStart({ x, y });
		setCurrentDrag({ x, y });
		setIsDraggingBox(true);
	}

	let sidebar;

	if (type == "recordingCanvas") {
		sidebar = <div className={styles.trackLabel} style={{ width: "200px" }}>
			{
				components.map((comp) => {
					return (
						<div key={comp.id} style={{ height: '50px', display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--daw-border)', boxSizing: 'border-box' }}>
							<button
								onClick={() => selected.setSelectedTrack(comp.id)}
								className={selected.selectedTrack == comp.id ? styles.trackLabelButtonActive : styles.trackLabelButton}
								style={{ height: '30px', minHeight: '30px', borderBottom: 'none', padding: '0 12px' }}
							>
								Track {comp.id}
							</button>
							{changeTrackVolume && (
								<div style={{ display: 'flex', alignItems: 'center', height: '20px', padding: '0 12px', background: 'var(--daw-bg-dark)' }}>
									<label style={{ fontSize: '9px', marginRight: '6px', color: 'var(--daw-text-muted)' }}>VOL</label>
									<input
										type="range"
										min="0"
										max="100"
										defaultValue={comp.volume !== undefined ? comp.volume : 100}
										onChange={(e) => changeTrackVolume(comp.id, parseFloat(e.target.value))}
										style={{ flex: 1, height: '4px', accentColor: 'var(--daw-accent-green)' }}
									/>
								</div>
							)}
						</div>
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

						<div ref={dragRef} style={{ position: "relative", userSelect: "none" }} onContextMenu={handleRightClick} onDragStart={(e) => e.preventDefault()} onMouseDown={handleMouseDownLocal}>
							{isDraggingBox && (
								<div style={{
									position: 'absolute',
									left: Math.min(dragStart.x, currentDrag.x),
									top: Math.min(dragStart.y, currentDrag.y),
									width: Math.abs(currentDrag.x - dragStart.x),
									height: Math.abs(currentDrag.y - dragStart.y),
									backgroundColor: 'rgba(52, 199, 89, 0.2)',
									border: '1px solid rgba(52, 199, 89, 0.6)',
									pointerEvents: 'none',
									zIndex: 1000
								}} />
							)}
							{range.map((item, index) => {
								return (
									<div key={index} className={styles.track} style={rulerStyle("30px")} draggable={false}></div>
								);
							})}
							{components.map((comp, i) => {
								return <div key={`comp-${i}`}>{comp}</div>;
							})}
						</div>
					</div>
				}
			</div>

			{contextMenu && (
				<div data-context-menu style={{
					position: 'fixed',
					left: contextMenu.x,
					top: contextMenu.y,
					backgroundColor: '#2a2a2a',
					border: '1px solid #444',
					borderRadius: '4px',
					padding: '4px 0',
					boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
					zIndex: 1000,
					minWidth: '150px'
				}}>
					{contextMenu.type === 'bg' && (
						<div
							style={{ padding: '8px 16px', cursor: 'pointer', color: '#fff', fontSize: '14px', userSelect: 'none' }}
							onClick={(e) => {
								e.stopPropagation();
								addNote(contextMenu.pos);
								setContextMenu(null);
							}}
							onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
							onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
						>
							Create Note
						</div>
					)}
					{contextMenu.type === 'note' && (
						<>
							{duplicateNote && (
								<div
									style={{ padding: '8px 16px', cursor: 'pointer', color: '#fff', fontSize: '14px', userSelect: 'none' }}
									onClick={(e) => {
										e.stopPropagation();
										duplicateNote(contextMenu.id);
										setContextMenu(null);
									}}
									onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
									onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
								>
									Duplicate
								</div>
							)}
							{deleteNote && (
								<div
									style={{ padding: '8px 16px', cursor: 'pointer', color: '#ff4444', fontSize: '14px', userSelect: 'none' }}
									onClick={(e) => {
										e.stopPropagation();
										deleteNote(contextMenu.id);
										setContextMenu(null);
									}}
									onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
									onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
								>
									Delete
								</div>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}