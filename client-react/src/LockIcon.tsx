export function LockIcon(props: {tooltip: string}) {
	return (
		<div data-tooltip={props.tooltip} className="icon-lock">
			<svg viewBox="0 0 512 512">
				<path d="M336,208V113a80,80,0,0,0-160,0v95" style={{
					fill: "none",
					stroke: "currentColor",
					strokeLinecap: "round",
					strokeLinejoin: "round",
					strokeWidth: "32px"
				}}/>
				<rect x="96" y="208" width="320" height="272" rx="48" ry="48" style={{
					fill: "none",
					stroke: "currentColor",
					strokeLinecap: "round",
					strokeLinejoin: "round",
					strokeWidth: "32px"
				}}/>
			</svg>
		</div>
	);
}
