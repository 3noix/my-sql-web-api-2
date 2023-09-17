export class DialogAddEdit {
	// @1: elements
	private background = document.querySelector(".add-edit-background") as HTMLDivElement;
	private form = this.background.querySelector(".add-edit-form") as HTMLFormElement;
	private inputId = this.form.querySelector("#id") as HTMLInputElement;
	private inputDescription = this.form.querySelector("#description") as HTMLInputElement;
	private inputNumber = this.form.querySelector("#number") as HTMLInputElement;
	private buttonOk = this.form.querySelector("#add-edit-ok") as HTMLButtonElement;
	private buttonCancel = this.form.querySelector("#add-edit-cancel") as HTMLButtonElement;

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
		this.background.style.display = visible ? "flex" : "none";
		if (visible) {this.inputDescription.focus();}
	}

	public setData(e: {id: number, description: string, number: number}): void {
		this.inputId.valueAsNumber = e.id;
		this.inputDescription.value = e.description;
		this.inputNumber.valueAsNumber = e.number;
	}

	public getData(): {id: number, description: string, number: number} {
		const id = this.inputId.valueAsNumber;
		const description = this.inputDescription.value;
		const number = this.inputNumber.valueAsNumber;
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

