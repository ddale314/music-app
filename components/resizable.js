import useDraggable from "../hooks/useDraggable.js";
import { useState, useEffect, useRef } from "react";

export default function ResizableComponent({ id, initialWidth, height, gridX, initialPos = { x: 0, y: 0 }, setData = null }) {
	const [resizing, setResizing] = useState(false);
	const [width, setWidth] = useState(initialWidth);
	const { dragging, ref, pos, setPos } = useDraggable({ x: gridX, y: height }, null, initialPos, () => { }, { x: 0, y: 0 }, true);

	// initial mouseX, component width, component x coordinate
	const dragStart = useRef({
		x: 0,
		w: 0,
		l: 0
	});

	useEffect(() => {
		if (setData) {
			setData(id, pos, width);
		}
	}, [setData, pos, width]);

	function handleMouseDownLeft(e) {
		setResizing(true);
		dragStart.current = {
			x: e.pageX,
			w: width,
			l: pos.x
		}
		document.addEventListener("mousemove", handleMouseMoveLeft);
		document.addEventListener("mouseup", handleMouseUp);
	}

	function handleMouseDownRight(e) {
		setResizing(true);
		dragStart.current = {
			x: e.pageX,
			w: width,
			l: pos.x
		}
		document.addEventListener("mousemove", handleMouseMoveRight);
		document.addEventListener("mouseup", handleMouseUp);
	}

	// cant use resizing here, need to create a ref
	// treat left resize as a translation left by the same amount as width increase to keep right edge constant
	function handleMouseMoveLeft(e) {
		// compute new width, pos as difference from original state
		// computing based on current state (e.g. e.pageX - pos.x) caused some issues
		const deltaX = e.pageX - dragStart.current.x;
		let newLeft = dragStart.current.l + deltaX;

		const SNAP_THRESHOLD = 10;
		if (gridX) {
			let nearestSnapL = Math.round(newLeft / gridX) * gridX;
			if (Math.abs(newLeft - nearestSnapL) < SNAP_THRESHOLD) {
				newLeft = nearestSnapL;
			}
		}

		const rightEdge = dragStart.current.l + dragStart.current.w;
		const newWidth = Math.max(10, rightEdge - newLeft);

		if (rightEdge - newLeft >= 10) {
			setWidth(newWidth);
			setPos({ x: newLeft, y: pos.y });
		}
	}

	// right resize is just a width increase
	function handleMouseMoveRight(e) {
		const deltaX = e.pageX - dragStart.current.x;
		let newWidth = dragStart.current.w + deltaX;

		const SNAP_THRESHOLD = 10;
		if (gridX) {
			let intendedRight = dragStart.current.l + newWidth;
			let nearestSnapR = Math.round(intendedRight / gridX) * gridX;
			if (Math.abs(intendedRight - nearestSnapR) < SNAP_THRESHOLD) {
				newWidth = nearestSnapR - dragStart.current.l;
			}
		}

		if (newWidth >= 10) {
			setWidth(newWidth);
		}
	}

	function handleMouseUp(e) {
		setResizing(false);
		document.removeEventListener("mousemove", handleMouseMoveLeft);
		document.removeEventListener("mousemove", handleMouseMoveRight);
		document.removeEventListener("mouseup", handleMouseUp);
	}

	return (
		<div>
			{/* Draggable portion (rendered underneath handles) */}
			{/* Must exactly match pos.x to prevent useDraggable drift calculation */}
			<div ref={ref} style={{ 
				position: "absolute", 
				left: pos.x, 
				top: pos.y + 2, 
				width: width, 
				height: height - 4,
				borderRadius: "4px",
				background: resizing 
					? "linear-gradient(180deg, var(--daw-accent-green-light, #4cd964) 0%, var(--daw-accent-green, #34c759) 100%)" 
					: "linear-gradient(180deg, var(--daw-accent-green, #34c759) 0%, var(--daw-accent-green-dark, #248a3d) 100%)",
				boxShadow: resizing ? "0 0 8px rgba(52, 199, 89, 0.6)" : "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
				border: "1px solid var(--daw-border, #1a632b)",
				cursor: "grab",
				zIndex: 1,
				userSelect: "none",
				boxSizing: "border-box"
			}} />

			{/* Left handle sitting on top! */}
			<div onMouseDown={handleMouseDownLeft} style={{ 
				position: "absolute", 
				left: pos.x, 
				top: pos.y + 2, 
				width: "6px", 
				height: height - 4, 
				cursor: "ew-resize", 
				zIndex: 2,
				backgroundColor: "rgba(255,255,255,0.15)",
				borderRight: "1px solid rgba(0,0,0,0.2)",
				borderTopLeftRadius: "4px",
				borderBottomLeftRadius: "4px",
				boxSizing: "border-box"
			}} />

			{/* Right handle sitting on top! */}
			<div onMouseDown={handleMouseDownRight} style={{ 
				position: "absolute", 
				left: pos.x + width - 6, 
				top: pos.y + 2, 
				width: "6px", 
				height: height - 4, 
				cursor: "ew-resize", 
				zIndex: 2,
				backgroundColor: "rgba(255,255,255,0.15)",
				borderLeft: "1px solid rgba(0,0,0,0.2)",
				borderTopRightRadius: "4px",
				borderBottomRightRadius: "4px",
				boxSizing: "border-box"
			}} />
		</div>
	);
}