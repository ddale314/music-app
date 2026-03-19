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
		setWidth(dragStart.current.w - deltaX);
		const newLeft = dragStart.current.l + deltaX;
		setPos({ x: newLeft, y: pos.y });
	}

	// right resize is just a width increase
	function handleMouseMoveRight(e) {
		const deltaX = e.pageX - dragStart.current.x;
		setWidth(dragStart.current.w + deltaX);
	}

	function handleMouseUp(e) {
		setResizing(false);
		document.removeEventListener("mousemove", handleMouseMoveLeft);
		document.removeEventListener("mousemove", handleMouseMoveRight);
		document.removeEventListener("mouseup", handleMouseUp);
	}

	return (
		<div>
			{console.log(pos.x)}
			{/* left handle */}
			<span onMouseDown={handleMouseDownLeft} style={{ backgroundColor: "grey", position: "absolute", left: pos.x - 10, top: pos.y, userSelect: "none", height: height }}>{"<"}</span>
			{/* draggable portion */}
			<span ref={ref} style={{ position: "absolute", backgroundColor: resizing ? "green" : "red", left: pos.x, top: pos.y, width: width, height: height }}></span>
			{/* right handle */}
			<span onMouseDown={handleMouseDownRight} style={{ backgroundColor: "grey", position: "absolute", left: pos.x + width, top: pos.y, userSelect: "none", height: height }}>{">"}</span>
		</div>
	);
}