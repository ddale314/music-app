export default function Ruler({ defaultWidth, tickGap, tickValue, tickUnit }) {
	const small = defaultWidth * tickGap * (1 / tickUnit);
	const large = small * tickValue;
	const smallTickHeight = 10;
	const largeTickHeight = 20;

	const rulerStyle = {
		width: "10000px",
		height: "30px",
		backgroundImage: "linear-gradient(to right, var(--daw-border-light) 1px, transparent 1px), linear-gradient(to right, var(--daw-text-muted) 1px, transparent 1px)",
		backgroundRepeat: "repeat-x",
		backgroundSize: `${small}px ${smallTickHeight}px, ${large}px ${largeTickHeight}px`,
		backgroundPosition: "0 100%, 0 100%",
		borderBottom: "1px solid var(--daw-border)",
		userSelect: "none"
	}

	return <div style={rulerStyle} onDragStart={(e) => e.preventDefault()} draggable={false}></div>
}