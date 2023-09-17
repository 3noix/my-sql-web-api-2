import "./style.scss";
import {MainPage} from "./main-page";
import {DialogAddEdit} from "./dialog-add-edit";
import {trpc} from "./trpc";


export const mainPage = new MainPage();
export const dialogAddEdit = new DialogAddEdit();


// @1: init
mainPage.setButtonsEnabled(false);
const {token} = await trpc.login.mutate({username: "client-vanilla", password: "password"});
window.addEventListener("beforeunload", () => {trpc.logout.mutate({token})});
// remark: the line above does not work
// - on Chrome: sometimes, but not always (didn't get why)
// - on Firefox: work if the tab being closed is not the last one in this Firefox window

const entries = await trpc.getAllEntries.query();
for (const e of entries) {mainPage.appendEntry(e);}
mainPage.setButtonsEnabled(true);


// @1: add / edit / remove buttons callbacks
type Mode = "closed" | "open-add" | "open-edit";
let mode: Mode = "closed";

function handleAddClicked() {
	// reset and display the dialog
	mode = "open-add";
	dialogAddEdit.setData({id: 0, description: "", number: 0});
	dialogAddEdit.setVisible(true);
}

async function handleEditClicked() {
	const selectedEntry = mainPage.selectedEntry();
	if (selectedEntry == null) {return;}

	try {
		// lock the entry to update
		await trpc.lock.mutate({entryId: selectedEntry.id, token});
		dialogAddEdit.setVisible(true);

		// fill and display the dialog
		mode = "open-edit";
		dialogAddEdit.setData(selectedEntry);
	}
	catch (error) {
		alert(error);
	}
}

async function handleDeleteClicked() {
	const selectedEntry = mainPage.selectedEntry();
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
}

mainPage.setOnAddClicked(handleAddClicked);
mainPage.setOnEditClicked(handleEditClicked);
mainPage.setOnDeleteClicked(handleDeleteClicked);


// @1: add/edit dialog callbacks
async function handleAddEditOk() {
	const entryFromDialog = dialogAddEdit.getData();
	if (entryFromDialog.description.length === 0 || isNaN(entryFromDialog.number)) {return;}
	dialogAddEdit.setVisible(false);
	
	if (mode === "open-add") {
		await handleAddOk();
	}
	else if (mode === "open-edit") {
		await handleEditOk();
	}
}

async function handleAddOk() {
	try {
		const entryFromDialog = dialogAddEdit.getData();
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
		const entryFromDialog = dialogAddEdit.getData();
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
			const entryFromDialog = dialogAddEdit.getData();
			await trpc.unlock.mutate({entryId: entryFromDialog.id, token});
		}
	}
	catch (error) {
		alert(error);
	}
	finally {
		dialogAddEdit.setVisible(false);
		mode = "closed";
	}
}

dialogAddEdit.setOnOkClicked(handleAddEditOk);
dialogAddEdit.setOnCancelClicked(handleAddEditCancel);


// @1: notifications
trpc.onLoggedOut.subscribe({token}, {
	onData: () => {
		console.log("Token expired!");
		alert("Token expired!");
	}
});

trpc.onEntryInserted.subscribe(undefined, {
	onData: (newEntry) => {
		mainPage.appendEntry(newEntry);
	}
});

trpc.onEntryUpdated.subscribe(undefined, {
	onData: (updatedEntry) => {
		mainPage.updateEntry(updatedEntry);
	}
});

trpc.onEntryDeleted.subscribe(undefined, {
	onData: ({deletedEntryId}) => {
		mainPage.deleteEntry(deletedEntryId);
	}
});

