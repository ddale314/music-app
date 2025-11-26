export default function Ruler({ tickGap, tickValue, tickUnit }) {
	const defaultWidth = 30;
	const small = defaultWidth * tickGap * (1 / tickUnit);
	const large = small * tickValue;
	const smallTickHeight = 10;
	const largeTickHeight = 20;

	const rulerStyle = {
		width: "150%",
		height: "50px",

		backgroundImage: "linear-gradient(90deg, rgb(0, 0, 0) 0 1px, transparent 0), linear-gradient(90deg, rgb(0, 0, 0) 0 1px, transparent 0)",
		
		backgroundRepeat: "repeat-x",
		backgroundSize: `${small}px ${smallTickHeight}px, ${large}px ${largeTickHeight}px`
	}

	return <div style={rulerStyle}></div>
}