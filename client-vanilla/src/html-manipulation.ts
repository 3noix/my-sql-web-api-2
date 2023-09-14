import {Entry} from "../../api-express-drizzle/src/db/types";
import * as el from "./html-elements";


export function setDialogVisible(visible: boolean): void {
	el.form.style.display = visible ? "flex" : "none";
	el.background.style.display = visible ? "flex" : "none";
	if (visible) {el.descriptionInput.focus();}
};

export function setButtonsEnabled(enabled: boolean): void {
	el.buttonAdd.disabled = !enabled;
	el.buttonEdit.disabled = !enabled;
	el.buttonRemove.disabled = !enabled;
};

export function selectedEntry(): Entry | null {
	const selectedRow = document.querySelector("tbody tr.selected");
	if (selectedRow == null) {return null;}

	const id = parseInt((selectedRow.querySelector("td:nth-child(1)") as HTMLTableElement).innerHTML);
	const description = (selectedRow.querySelector("td:nth-child(2)") as HTMLTableElement).innerHTML;
	const number = parseInt((selectedRow.querySelector("td:nth-child(3)") as HTMLTableElement).innerHTML);
	const lastModif = (selectedRow.querySelector("td:nth-child(4)") as HTMLTableElement).innerHTML;
	return {id, description, number, lastModif};
}

export function deselectAllRows(): void {
	for (const tr of document.querySelectorAll("tbody tr")) {
		tr.classList.remove("selected");
	}
}

export function setDialogEntry(e: {id: number, description: string, number: number}) {
	el.idInput.valueAsNumber = e.id;
	el.descriptionInput.value = e.description;
	el.numberInput.valueAsNumber = e.number;
}

export function getDialogEntry(): {id: number, description: string, number: number} {
	const id = el.idInput.valueAsNumber;
	const description = el.descriptionInput.value;
	const number = el.numberInput.valueAsNumber;
	return {id, description, number};
}

export function appendEntryInHtml(e: Entry): void {
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
	el.tableBody.appendChild(line);

	line.addEventListener("click", () => {
		for (const tr of document.querySelectorAll("tbody tr")) {tr.classList.remove("selected");}
		line.classList.add("selected");
	});
};

export function updateEntryInHtml(e: Entry): boolean {
	const elt = getEntryHtmlElt(e.id);
	if (elt == null) {return false;}

	(elt.querySelector("td:nth-child(2)") as HTMLTableElement).innerHTML = e.description;
	(elt.querySelector("td:nth-child(3)") as HTMLTableElement).innerHTML = e.number.toString();
	(elt.querySelector("td:nth-child(4)") as HTMLTableElement).innerHTML = e.lastModif;
	return true;
};

export function deleteEntryInHtml(id: number): boolean {
	const elt = getEntryHtmlElt(id);
	if (elt == null) {return false;}
	elt.remove();
	return true;
};

function getEntryHtmlElt(id: number): HTMLTableElement | null {
	for (const htmlRow of document.querySelectorAll("tbody tr")) {
		const currentId = parseInt(htmlRow.querySelector("td:nth-child(1)")?.innerHTML || "-1");
		if (currentId === id) {return htmlRow as HTMLTableElement;}
	}
	return null;
};
