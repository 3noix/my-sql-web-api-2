import "./style.scss";
import * as el from "./html-elements";
import * as html from "./html-manipulation";
import {trpc} from "./trpc";


// @1: init
html.setButtonsEnabled(false);
const {token} = await trpc.register.query({name: "3noix"});
const entries = await trpc.getAllEntries.query();
for (const e of entries) {html.appendEntryInHtml(e);}
html.setButtonsEnabled(true);


// @1: add / edit / remove buttons callbacks
type Mode = "none" | "add" | "edit";
let mode: Mode = "none";

el.buttonAdd.addEventListener("click", e => {
	// reset and display the dialog
	mode = "add";
	el.idInput.valueAsNumber = 0;
	el.descriptionInput.value = "";
	el.numberInput.valueAsNumber = 0;
	html.setDialogVisible(true);
});

el.buttonEdit.addEventListener("click", async (e) => {
	const selectedRow = document.querySelector("tbody tr.selected");
	if (selectedRow == null) {return;}

	// lock the entry to update
	const id = parseInt((selectedRow.querySelector("td:nth-child(1)") as HTMLTableElement).innerHTML);
	await trpc.lock.mutate({entryId: id, token});
	html.setDialogVisible(true);

	// fill and display the dialog
	mode = "edit";
	el.idInput.valueAsNumber = id;
	el.descriptionInput.value = (selectedRow.querySelector("td:nth-child(2)") as HTMLTableElement).innerHTML;
	el.numberInput.value = (selectedRow.querySelector("td:nth-child(3)") as HTMLTableElement).innerHTML;
});

el.buttonRemove.addEventListener("click", async (e) => {
	const selectedRow = document.querySelector("tbody tr.selected");
	if (selectedRow == null) {return;}

	// lock the entry to delete
	let id = parseInt((selectedRow.querySelector("td:nth-child(1)") as HTMLTableElement).innerHTML);
	await trpc.lock.mutate({entryId: id, token});

	// send delete request
	await trpc.deleteEntry.mutate({entryId: id, token});
});


// @1: dialog buttons callbacks
el.buttonOk.addEventListener("click", async (e) => {
	if (el.descriptionInput.value.length === 0 || el.numberInput.value.length === 0) {return;}
	html.setDialogVisible(false);
	
	if (mode === "add") {
		await trpc.insertEntry.mutate({
			description: el.descriptionInput.value,
			number: el.numberInput.valueAsNumber
		});
	}
	else if (mode === "edit") {
		const id = parseInt(el.idInput.value);
		await trpc.updateEntry.mutate({
			id,
			description: el.descriptionInput.value,
			number: el.numberInput.valueAsNumber,
			token
		});

		// unlock the updated entry
		await trpc.unlock.mutate({entryId: id, token});
	}

	mode = "none";
});

el.buttonCancel.addEventListener("click", async (e) => {
	if (mode === "edit") {
		// unlock the entry being edited
		await trpc.unlock.mutate({entryId: el.idInput.valueAsNumber, token});
	}

	html.setDialogVisible(false);
	mode = "none";
});


// @1: other callbacks
el.tableHeader.addEventListener("click", html.deselectAllRows);


// @1: notifications
trpc.onInsert.subscribe(undefined, {
	onData: (newEntry) => {
		html.appendEntryInHtml(newEntry);
	}
});

trpc.onUpdate.subscribe(undefined, {
	onData: (updatedEntry) => {
		html.updateEntryInHtml(updatedEntry);
	}
});

trpc.onDelete.subscribe(undefined, {
	onData: ({deletedEntryId}) => {
		html.deleteEntryInHtml(deletedEntryId);
	}
});

