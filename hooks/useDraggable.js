import { useState, useRef, useEffect } from "react";

/* 
	grid: object with x and y, component will "snap" to coordinates in multiples of grid.x and grid.y
	fixAxis: fix movement horizontally (x) or vertically (y)
	updateFunction: called every time position is updated
	normal: whether or not the ref is attached to the element actually being moved (see recordingCanvas)
*/
export default function useDraggable(grid, fixAxis, initialPos, updateFunction, customOffset, normal, triggerIn = null) {
	const [dragging, setDragging] = useState(false);
	const [pos, setPos] = useState({ x: initialPos.x, y: initialPos.y });
	// stores mouse position relative to coordinates of bounding box (?)
	const [relPos, setRelPos] = useState({ x: 0, y: 0 });
	const ref = useRef();

	useEffect(() => {
		if (ref.current) ref.current.addEventListener("mousedown", handleMouseDown);
		return () => {
			if (ref.current) ref.current.removeEventListener("mousedown", handleMouseDown);
		};
	}, [ref.current]);

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging, pos, relPos, grid]);

	function handleMouseMove(e) {
		if (!dragging) return;
		let parentRect = ref.current.offsetParent.getBoundingClientRect();

		const element = ref.current.parentElement;
		let diffX = normal ? relPos.x : ref.current.getBoundingClientRect().left;
		let diffY = normal ? relPos.y : ref.current.getBoundingClientRect().top;

		console.log(ref.current.getBoundingClientRect().left);
		if (ref.current.offsetParent != document.body) {
			diffX += parentRect.left;
			diffY += parentRect.top;
		}
		let p = {
			x: Math.trunc((e.pageX - diffX - customOffset.x + element.scrollLeft) / grid.x) * grid.x,
			y: Math.trunc((e.pageY - diffY - customOffset.y + element.scrollTop) / grid.y) * grid.y
		};
		if (fixAxis == "y") {
			p.x = initialPos.x;
		}
		if (fixAxis == "x") {
			p.y = initialPos.y;
		}
		if (p.x >= 0 && p.y >= 0) {
			setPos(p);
		}
		updateFunction(p);
		e.preventDefault();
	}

	function handleMouseDown(e) {
		if (!ref.current) return;
		const box = ref.current.getBoundingClientRect();

		if (triggerIn) {
			const element = ref.current.parentElement;
			const clickY = e.clientY - box.top;
			const clickX = e.clientX - box.left;

			if (triggerIn.top !== undefined && clickY < element.scrollTop + triggerIn.top) return;
			if (triggerIn.bottom !== undefined && clickY > element.scrollTop + triggerIn.bottom) return;
			if (triggerIn.left !== undefined && clickX < element.scrollLeft + triggerIn.left) return;
			if (triggerIn.right !== undefined && clickX > element.scrollLeft + triggerIn.right) return;
		}
		setRelPos({
			x: e.clientX - box.left,
			y: e.clientY - box.top
		});

		setDragging(true);

		if (!normal) {
			// update instantly on click for playhead
			let p = {
				x: Math.trunc((e.clientX - box.left) / grid.x) * grid.x,
				y: Math.trunc((e.clientY - box.top) / grid.y) * grid.y
			};
			if (fixAxis === "y") p.x = initialPos.x;
			if (fixAxis === "x") p.y = initialPos.y;
			if (p.x >= 0 && p.y >= 0) {
				setPos(p);
				updateFunction(p);
			}
		}
		e.preventDefault();
	}

	function handleMouseUp(e) {
		if (dragging) {
			setDragging(false);
			e.preventDefault();
		}
	}

	return { dragging, ref, pos, setPos };
}