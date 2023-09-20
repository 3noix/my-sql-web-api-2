import React from "react";
import "./Button.scss";


export type ButtonProps = {
	children?: React.ReactNode;
	disabled?: boolean;
	onClick: React.MouseEventHandler;
};


export default function Button({disabled, onClick, children}: ButtonProps) {
	return (
		<button type="button" onClick={onClick} disabled={disabled ?? false}>
			{children}
		</button>
	);
}
