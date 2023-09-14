import React, {useRef} from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import "./FormAddEdit.scss";


const Overlay = styled.div`
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(0,0,0,0.5);
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
`;

export type FormAddEditData = {
	id: number;
	description: string;
	number: number;
};

export type FormAddEditProps = {
	isOpen: boolean;
	initialData: FormAddEditData;
	onOk: (newData: FormAddEditData) => void;
	onCancel: (entryId: number) => void;
};


export default function FormAddEdit({isOpen, initialData, onOk, onCancel}: FormAddEditProps) {
	if (!isOpen) {return null;}

	const descriptionRef = useRef<HTMLInputElement>(null);
	const numberRef = useRef<HTMLInputElement>(null);

	return ReactDOM.createPortal(
		<Overlay>
			<form className="add-edit" onKeyDown={handleKeyDown}>
				<div className="for-field">
					<label htmlFor="description">Description:</label>
					<input type="text" name="description" id="description"
						defaultValue={initialData.description}
						ref={descriptionRef}
						autoFocus
					/>
				</div>
				<div className="for-field">
					<label htmlFor="number">Number:</label>
					<input type="number" name="number" id="number"
						defaultValue={Number.isNaN(initialData.number) ? "" : initialData.number}
						ref={numberRef}
					/>
				</div>
				<div className="for-buttons">
					<button type="button" id="ok" onClick={handleOk}>Ok</button>
				</div>
				<div className="close-button" onClick={handleCancel}/>
			</form>
		</Overlay>,
		document.getElementById("portalAddEditModal") as HTMLElement
	);

	function handleOk() {
		// checks
		const description = descriptionRef.current?.value || "";
		const number = parseInt(numberRef.current?.value || "");
		if (description.length === 0) {return;}
		if (Number.isNaN(number)) {return;}

		// execute the callback with the new data
		onOk({id: initialData.id, description, number});
	}

	function handleCancel() {
		onCancel(initialData.id);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
		if (event.key === "Enter") {handleOk();}
		if (event.key === "Escape") {handleCancel();}
	}
}

