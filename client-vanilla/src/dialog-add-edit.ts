export class DialogAddEdit {
	// @1: elements
	private background = document.querySelector(".background") as HTMLDivElement;
	private form = document.querySelector("form") as HTMLFormElement;
	private idInput = document.querySelector("#id") as HTMLInputElement;
	private descriptionInput = document.querySelector("#desc") as HTMLInputElement;
	private numberInput = document.querySelector("#number") as HTMLInputElement;
	private buttonOk = document.querySelector("#ok") as HTMLButtonElement;
	private buttonCancel = document.querySelector("#cancel") as HTMLButtonElement;

	// @1: callbacks
	private onOkClicked = () => {};
	private onCancelClicked = () => {};
	private onKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Enter") {this.onOkClicked();}
		if (event.key === "Escape") {this.onCancelClicked();}
	};

	// @1: constructor
	public constructor() {
		this.form.addEventListener("keydown", this.onKeyDown);
		this.buttonOk.addEventListener("click", this.onOkClicked);
		this.buttonCancel.addEventListener("click", this.onCancelClicked);
	}

	// @1: functions
	public setVisible(visible: boolean): void {
		this.form.style.display = visible ? "flex" : "none";
		this.background.style.display = visible ? "flex" : "none";
		if (visible) {this.descriptionInput.focus();}
	}

	public setData(e: {id: number, description: string, number: number}): void {
		this.idInput.valueAsNumber = e.id;
		this.descriptionInput.value = e.description;
		this.numberInput.valueAsNumber = e.number;
	}

	public getData(): {id: number, description: string, number: number} {
		const id = this.idInput.valueAsNumber;
		const description = this.descriptionInput.value;
		const number = this.numberInput.valueAsNumber;
		return {id, description, number};
	}

	// @1: set callbacks
	public setOnOkClicked(cb: () => void): void {
		this.buttonOk.removeEventListener("click", this.onOkClicked);
		this.onOkClicked = cb;
		this.buttonOk.addEventListener("click", this.onOkClicked);
	}

	public setOnCancelClicked(cb: () => void): void {
		this.buttonCancel.removeEventListener("click", this.onCancelClicked);
		this.onCancelClicked = cb;
		this.buttonCancel.addEventListener("click", this.onCancelClicked);
	}
}

