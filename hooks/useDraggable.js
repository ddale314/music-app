import { useState, useRef, useEffect } from "react";

/* 
	grid: object with x and y, component will "snap" to coordinates in multiples of grid.x and grid.y
	fixAxis: fix movement horizontally (x) or vertically (y)
	updateFunction: called every time position is updated
	normal: whether or not the ref is attached to the element actually being moved (see recordingCanvas)
*/
export default function useDraggable(grid, fixAxis, initialPos, updateFunction, customOffset, normal) {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ref.current]);

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dragging, pos, relPos, grid]);

	// recalculate position when grid parameter is modified (e.g. when quantization value is changed)
	useEffect(() => {
		let p = {
			x: Math.trunc(pos.x / grid.x) * grid.x,
			y: Math.trunc(pos.y / grid.y) * grid.y
		};
		updateFunction(p);
		setPos(p);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [grid.x, grid.y]);

	function handleMouseMove(e) {
		if (!dragging) return;
		let parentRect = ref.current.offsetParent.getBoundingClientRect();

		const element = ref.current.parentElement;
		let diffX = normal ? relPos.x : 0;
		let diffY = normal ? relPos.y : 0;
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