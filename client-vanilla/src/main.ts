import "./style.scss";
import * as el from "./html-elements";
import * as html from "./html-manipulation";
import {trpc} from "./trpc";


// @1: init
html.setButtonsEnabled(false);
const {token} = await trpc.login.query({username: "client-vanilla", password: "password"});
const entries = await trpc.getAllEntries.query();
for (const e of entries) {html.appendEntryInHtml(e);}
html.setButtonsEnabled(true);


// @1: add / edit / remove buttons callbacks
type Mode = "closed" | "open-add" | "open-edit";
let mode: Mode = "closed";

el.buttonAdd.addEventListener("click", e => {
	// reset and display the dialog
	mode = "open-add";
	html.setDialogEntry({id: 0, description: "", number: 0});
	html.setDialogVisible(true);
});

el.buttonEdit.addEventListener("click", async (e) => {
	const selectedEntry = html.selectedEntry();
	if (selectedEntry == null) {return;}

	try {
		// lock the entry to update
		await trpc.lock.mutate({entryId: selectedEntry.id, token});
		html.setDialogVisible(true);

		// fill and display the dialog
		mode = "open-edit";
		html.setDialogEntry(selectedEntry);
	}
	catch (error) {
		alert(error);
	}
});

el.buttonRemove.addEventListener("click", async (e) => {
	const selectedEntry = html.selectedEntry();
	if (selectedEntry == null) {return;}

	try {
		// lock the entry to delete
		await trpc.lock.mutate({entryId: selectedEntry.id, token});

		// send delete request
		await trpc.deleteEntry.mutate({entryId: selectedEntry.id, token});
	}
	catch (error) {
		alert(error);
	}
});


// @1: dialog callbacks
async function handleAddEditOk() {
	const entryFromDialog = html.getDialogEntry();
	if (entryFromDialog.description.length === 0 || isNaN(entryFromDialog.number)) {return;}
	html.setDialogVisible(false);
	
	if (mode === "open-add") {
		await handleAddOk();
	}
	else if (mode === "open-edit") {
		await handleEditOk();
	}
}

async function handleAddOk() {
	try {
		const entryFromDialog = html.getDialogEntry();
		await trpc.insertEntry.mutate({
			description: entryFromDialog.description,
			number: entryFromDialog.number
		});
	}
	catch (error) {
		alert(error);
	}
	finally {
		mode = "closed";
	}
}

async function handleEditOk() {
	try {
		const entryFromDialog = html.getDialogEntry();
		await trpc.updateEntry.mutate({...entryFromDialog, token});
	
		// unlock the updated entry
		await trpc.unlock.mutate({entryId: entryFromDialog.id, token});
	}
	catch (error) {
		alert(error);
	}
	finally {
		mode = "closed";
	}
}

async function handleAddEditCancel() {
	try {
		if (mode === "open-edit") {
			// unlock the entry being edited
			const entryFromDialog = html.getDialogEntry();
			await trpc.unlock.mutate({entryId: entryFromDialog.id, token});
		}
	}
	catch (error) {
		alert(error);
	}
	finally {
		html.setDialogVisible(false);
		mode = "closed";
	}
}

function handleAddEditKeyDown(event: KeyboardEvent) {
	if (event.key === "Enter") {handleAddEditOk();}
	if (event.key === "Escape") {handleAddEditCancel();}
}

el.buttonOk.addEventListener("click", handleAddEditOk);
el.buttonCancel.addEventListener("click", handleAddEditCancel);
el.form.addEventListener("keydown", handleAddEditKeyDown);


// @1: other callbacks
el.tableHeader.addEventListener("click", html.deselectAllRows);


// @1: notifications
trpc.onEntryInserted.subscribe(undefined, {
	onData: (newEntry) => {
		html.appendEntryInHtml(newEntry);
	}
});

trpc.onEntryUpdated.subscribe(undefined, {
	onData: (updatedEntry) => {
		html.updateEntryInHtml(updatedEntry);
	}
});

trpc.onEntryDeleted.subscribe(undefined, {
	onData: ({deletedEntryId}) => {
		html.deleteEntryInHtml(deletedEntryId);
	}
});

