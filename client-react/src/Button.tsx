import React from "react";
import "./Button.scss";


export type ButtonProps = {
	iconClass: string;
	disabled: boolean;
	onClick: React.MouseEventHandler;
};


export default function Button({iconClass, disabled, onClick}: ButtonProps) {
	return (
		<button type="button" onClick={onClick} disabled={disabled}>
			<i className={iconClass}></i>
		</button>
	);
}

