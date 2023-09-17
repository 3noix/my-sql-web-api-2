import {Entry} from "../../api-express-drizzle/src/db/types";


export class MainPage {
	// @1: elements
	private buttonAdd = document.querySelector("#add") as HTMLButtonElement;
	private buttonEdit = document.querySelector("#edit") as HTMLButtonElement;
	private buttonRemove = document.querySelector("#remove") as HTMLButtonElement;
	private tableHeader = document.querySelector("thead") as HTMLTableSectionElement;
	private tableBody = document.querySelector("tbody") as HTMLTableSectionElement;

	// @1: callbacks
	private onAddClicked = () => {};
	private onEditClicked = () => {};
	private onDeleteClicked = () => {};

	// @1: constructor
	public constructor() {
		this.tableHeader.addEventListener("click", this.deselectAllRows);
		this.buttonAdd.addEventListener("click", this.onAddClicked);
		this.buttonEdit.addEventListener("click", this.onEditClicked);
		this.buttonRemove.addEventListener("click", this.onDeleteClicked);
	}

	// @1: functions
	public setButtonsEnabled(enabled: boolean): void {
		this.buttonAdd.disabled = !enabled;
		this.buttonEdit.disabled = !enabled;
		this.buttonRemove.disabled = !enabled;
	}

	public selectedEntry(): Entry| null {
		const selectedRow = document.querySelector("tbody tr.selected");
		if (selectedRow == null) {return null;}

		const id = parseInt((selectedRow.querySelector("td:nth-child(1)") as HTMLTableElement).innerHTML);
		const description = (selectedRow.querySelector("td:nth-child(2)") as HTMLTableElement).innerHTML;
		const number = parseInt((selectedRow.querySelector("td:nth-child(3)") as HTMLTableElement).innerHTML);
		const lastModif = (selectedRow.querySelector("td:nth-child(4)") as HTMLTableElement).innerHTML;
		return {id, description, number, lastModif};
	}

	private deselectAllRows(): void {
		for (const tr of document.querySelectorAll("tbody tr")) {
			tr.classList.remove("selected");
		}
	}

	public appendEntry(e: Entry): void {
		const line = document.createElement("tr");
		const col1 = document.createElement("td");
		const col2 = document.createElement("td");
		const col3 = document.createElement("td");
		const col4 = document.createElement("td");
		col1.innerHTML = e.id.toString();
		col2.innerHTML = e.description;
		col3.innerHTML = e.number.toString();
		col4.innerHTML = e.lastModif;
		line.appendChild(col1);
		line.appendChild(col2);
		line.appendChild(col3);
		line.appendChild(col4);
		this.tableBody.appendChild(line);

		line.addEventListener("click", () => {
			for (const tr of document.querySelectorAll("tbody tr")) {tr.classList.remove("selected");}
			line.classList.add("selected");
		});
	}

	public updateEntry(e: Entry): boolean {
		const elt = this.getEntryHtmlElement(e.id);
		if (elt == null) {return false;}

		(elt.querySelector("td:nth-child(2)") as HTMLTableElement).innerHTML = e.description;
		(elt.querySelector("td:nth-child(3)") as HTMLTableElement).innerHTML = e.number.toString();
		(elt.querySelector("td:nth-child(4)") as HTMLTableElement).innerHTML = e.lastModif;
		return true;
	}

	public deleteEntry(entryId: number): boolean {
		const elt = this.getEntryHtmlElement(entryId);
		if (elt == null) {return false;}
		elt.remove();
		return true;
	}

	private getEntryHtmlElement(entryId: number): HTMLTableElement | null {
		for (const htmlRow of document.querySelectorAll("tbody tr")) {
			const currentId = parseInt(htmlRow.querySelector("td:nth-child(1)")?.innerHTML || "-1");
			if (currentId === entryId) {return htmlRow as HTMLTableElement;}
		}
		return null;
	}

	// @1: set callbacks
	public setOnAddClicked(cb: () => void): void {
		this.buttonAdd.removeEventListener("click", this.onAddClicked);
		this.onAddClicked = cb;
		this.buttonAdd.addEventListener("click", this.onAddClicked);
	}

	public setOnEditClicked(cb: () => void): void {
		this.buttonEdit.removeEventListener("click", this.onEditClicked);
		this.onEditClicked = cb;
		this.buttonEdit.addEventListener("click", this.onEditClicked);
	}

	public setOnDeleteClicked(cb: () => void): void {
		this.buttonRemove.removeEventListener("click", this.onDeleteClicked);
		this.onDeleteClicked = cb;
		this.buttonRemove.addEventListener("click", this.onDeleteClicked);
	}
}
