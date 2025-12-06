import { useState, useRef, useEffect } from "react";

export default function useDraggable(grid, fixAxis, initialPos) {
	const [dragging, setDragging] = useState(false);
	const [pos, setPos] = useState({x: 0, y: 0});
	const [relPos, setRelPos] = useState({x: 0, y: 0});
	const ref = useRef();

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("mousedown", handleMouseDown);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("mousedown", handleMouseDown);
		};

	}, [dragging]);

	function handleMouseMove(e) {
		if (!dragging) return;
		let p = {
			x: Math.trunc((e.pageX - relPos.x) / grid.x) * grid.x,
			y: Math.trunc((e.pageY - relPos.y) / grid.y) * grid.y
		};
		if (fixAxis == "y") {
			p.x = initialPos.x;
		}
		if (fixAxis == "x") {
			p.y = initialPos.y;
		}
		setPos(p);
		//e.stopPropagation();
		e.preventDefault();
	}

	function handleMouseDown(e) {
		const box = ref.current.getBoundingClientRect();
		const body = document.body;
		let rel = {
			x: e.pageX - (box.left + body.scrollLeft - body.clientLeft), 
			y: e.pageY - (box.top + body.scrollTop - body.clientTop)
		};
		if (fixAxis == "y") {
			rel.x = initialPos.x;
		}
		if (fixAxis == "x") {
			rel.y = initialPos.y;
		}
		setRelPos(rel);
		setDragging(true);
		//e.stopPropagation();
		e.preventDefault();
	}

	function handleMouseUp(e) {
		setDragging(false);
		//e.stopPropagation();
		e.preventDefault();
	}

	return {
		dragging: dragging,
		ref: ref,
		pos: pos
	};
}