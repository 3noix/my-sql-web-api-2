export class DialogLogin {
	// @1: elements
	private background = document.querySelector(".login-background") as HTMLDivElement;
	private form = this.background.querySelector(".login-form") as HTMLFormElement;
	private inputUsername = this.form.querySelector("#username") as HTMLInputElement;
	private inputPassword = this.form.querySelector("#password") as HTMLInputElement;
	private buttonOk = this.form.querySelector("#login-ok") as HTMLButtonElement;

	// @1: callbacks
	private onOkClicked = () => {};
	private onKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Enter") {this.onOkClicked();}
	};

	// @1: constructor
	public constructor() {
		this.form.addEventListener("keydown", this.onKeyDown);
		this.buttonOk.addEventListener("click", this.onOkClicked);
	}

	// @1: functions
	public setVisible(visible: boolean): void {
		this.background.style.display = visible ? "flex" : "none";
		if (visible) {
			this.inputUsername.value = "";
			this.inputPassword.value = "";
			this.inputUsername.focus();
		}
	}

	// @1: set callbacks
	public setOnOkClicked(cb: (u: string, p: string) => void): void {
		const cb2 = () => {
			const username = this.inputUsername.value;
			const password = this.inputPassword.value;

			if (username.length <= 2 || password.length <= 2) {
				alert(`Authentication failed!`);
				return;
			}

			cb(username, password);
		};

		this.buttonOk.removeEventListener("click", this.onOkClicked);
		this.onOkClicked = cb2;
		this.buttonOk.addEventListener("click", this.onOkClicked);
	}
}
