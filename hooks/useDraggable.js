import { useState, useRef, useEffect } from "react";

export default function useDraggable(grid, fixAxis, initialPos, updateFunction, customOffset, normal) {
	const [dragging, setDragging] = useState(false);
	const [pos, setPos] = useState({x: initialPos.x, y: initialPos.y});
	const [relPos, setRelPos] = useState({x: 0, y: 0});
	const ref = useRef();


	useEffect(() => {
		ref.current.addEventListener("mousedown", handleMouseDown);

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

	}, [dragging]);

	useEffect(() => {
		let p = {
			x: Math.trunc(pos.x / grid.x) * grid.x,
			y: Math.trunc(pos.y / grid.y) * grid.y
		}
		updateFunction(p);
		setPos(p);
	}, [grid.x, grid.y])

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
		const box = ref.current.getBoundingClientRect();
		const element = document.documentElement;

		let diffX = box.left - element.clientLeft;
		let diffY = box.top - element.clientTop;
		if (ref.current.offsetParent == document.body) {
			diffX += element.scrollLeft;
			diffY += element.scrollTop;
		}
		let rel = {
			x: e.pageX - diffX, 
			y: e.pageY - diffY
		};
		if (fixAxis == "y") {
			rel.x = initialPos.x;
		}
		if (fixAxis == "x") {
			rel.y = initialPos.y;
		}
		setRelPos(rel);
		setDragging(true);
		e.preventDefault();
	}

	function handleMouseUp(e) {
		if (dragging) {
			setDragging(false);
			e.preventDefault();
		}
	}

	return {
		dragging: dragging,
		ref: ref,
		pos: pos,
		setPos: setPos
	};
}