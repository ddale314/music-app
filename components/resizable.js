import useDraggable from "../hooks/useDraggable.js";
import { useState, useEffect, useRef } from "react";

export default function ResizableComponent({ initialWidth, height }) {
	const [resizing, setResizing] = useState(false);
	const [width, setWidth] = useState(initialWidth);
	const {dragging, ref, pos, setPos} = useDraggable({x: 1, y: height}, null, {x: 0, y: 0}, ()=>{}, {x: 0, y: 0}, true);
	const dragStart = useRef({
		x: 0,
		w: 0,
		l: 0
	});

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
	function handleMouseMoveLeft(e) {
		const deltaX = e.pageX - dragStart.current.x;
		setWidth(dragStart.current.w - deltaX);
		const newLeft = dragStart.current.l + deltaX;
		setPos({x: newLeft, y: pos.y});
	}

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
			<span onMouseDown={handleMouseDownLeft} style={{backgroundColor: "grey", position: "absolute", left: pos.x - 10, top: pos.y, userSelect: "none", height: height}}>{"<"}</span>
			<span ref={ref} style={{position: "absolute", backgroundColor: resizing ? "green" : "red", left: pos.x, top: pos.y, width: width, height: height}}>Drag Me!</span>
			<span onMouseDown={handleMouseDownRight} style={{backgroundColor: "grey", position: "absolute", left: pos.x + width, top: pos.y, userSelect: "none", height: height}}>{">"}</span>
		</div>
	);
}