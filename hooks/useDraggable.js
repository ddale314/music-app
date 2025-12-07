import { useState, useRef, useEffect } from "react";

export default function useDraggable(grid, fixAxis, initialPos, updateFunction) {
	const [dragging, setDragging] = useState(false);
	const [pos, setPos] = useState({x: 0, y: 0});
	const [relPos, setRelPos] = useState({x: 0, y: 0});
	const ref = useRef();


	useEffect(() => {
		ref.current.addEventListener("mousedown", handleMouseDown);

		return () => {
			ref.current.removeEventListener("mousedown", handleMouseDown);
		};
	}, [ref.current]);
	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("mousedown", handleMouseDown);
		};

	}, [dragging]);

	function handleMouseMove(e) {
		if (!dragging) return;
		console.log("left:", ref.current.offsetParent.getBoundingClientRect().left);
		let parentRect = ref.current.offsetParent.getBoundingClientRect();
		let p = {
			x: Math.trunc((e.pageX - relPos.x - parentRect.left) / grid.x) * grid.x,
			y: Math.trunc((e.pageY - relPos.y - parentRect.top) / grid.y) * grid.y
		};
		if (fixAxis == "y") {
			p.x = initialPos.x;
		}
		if (fixAxis == "x") {
			p.y = initialPos.y;
		}
		setPos(p);
		updateFunction(p);
		console.log("pos:", p.x);
		e.preventDefault();
	}

	function handleMouseDown(e) {
		const box = ref.current.getBoundingClientRect();
		const element = document.documentElement;
		console.log(element.clientLeft);
		let rel = {
			x: e.pageX - (box.left - element.clientLeft), 
			y: e.pageY - (box.top - element.clientTop)
		};
		if (fixAxis == "y") {
			rel.x = initialPos.x;
		}
		if (fixAxis == "x") {
			rel.y = initialPos.y;
		}
		setRelPos(rel);
		console.log("rel:", rel.x)
		setDragging(true);
		e.preventDefault();
	}

	function handleMouseUp(e) {
		setDragging(false);
		e.preventDefault();
	}

	return {
		dragging: dragging,
		ref: ref,
		pos: pos
	};
}