import "./style.scss";
import {Credentials} from "./credentials";
import {MainPage} from "./main-page";
import {DialogAddEdit} from "./dialog-add-edit";
import {DialogLogin} from "./dialog-login";
import {trpc} from "./trpc";

export const auth = new Credentials();
export const mainPage = new MainPage();
export const dialogLogin = new DialogLogin();
export const dialogAddEdit = new DialogAddEdit();


// @1: init
mainPage.setButtonsEnabled(false);
dialogLogin.setOnOkClicked(async (username: string, password: string) => {
	try {
		const {token} = await trpc.login.mutate({username, password});
		auth.login(username, password, token);
		dialogLogin.setVisible(false);

		mainPage.clearAllEntries();
		const entries = await trpc.getAllEntries.query();
		for (const e of entries) {mainPage.appendEntry(e);}
		mainPage.setButtonsEnabled(true);

		// subscription that needs the token to be sent when subscribing
		const onLoggedOutUnsubscribable = trpc.onLoggedOut.subscribe({token: auth.token()}, {
			onData: () => {
				auth.logout();
				mainPage.setButtonsEnabled(false);
				dialogAddEdit.setVisible(false);
				dialogLogin.setVisible(true);
				onLoggedOutUnsubscribable.unsubscribe();
			}
		});
	}
	catch (error) {
		if (typeof error === "object" && error !== null && "message" in error) {alert(`Authentication failed:\n${error.message}`);}
		else {alert(error);}
	}
});

dialogAddEdit.setVisible(false);
dialogLogin.setVisible(true);


window.addEventListener("beforeunload", () => {trpc.logout.mutate({token: auth.token()})});
// remark: the line above does not work
// - on Chrome: sometimes, but not always (didn't get why)
// - on Firefox: work if the tab being closed is not the last one in this Firefox window


// @1: buttons callbacks (add, edit, remove)
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
		await trpc.lock.mutate({entryId: selectedEntry.id, token: auth.token()});
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
		await trpc.lock.mutate({entryId: selectedEntry.id, token: auth.token()});

		// send delete request
		await trpc.deleteEntry.mutate({entryId: selectedEntry.id, token: auth.token()});
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
		await trpc.updateEntry.mutate({...entryFromDialog, token: auth.token()});
	
		// unlock the updated entry
		await trpc.unlock.mutate({entryId: entryFromDialog.id, token: auth.token()});
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
			await trpc.unlock.mutate({entryId: entryFromDialog.id, token: auth.token()});
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


// @1: notifications that don't need the token to be sent when subscribing
trpc.onEntryLocked.subscribe(undefined, {
	onData: ({entryId, username}) => {
		if (!auth.isLoggedIn()) {return;}
		mainPage.lockEntry(entryId, username);
	}
});

trpc.onEntryUnlocked.subscribe(undefined, {
	onData: ({entryId}) => {
		if (!auth.isLoggedIn()) {return;}
		mainPage.unlockEntry(entryId);
	}
});

trpc.onEntryInserted.subscribe(undefined, {
	onData: (newEntry) => {
		if (!auth.isLoggedIn()) {return;}
		mainPage.appendEntry({...newEntry, lockedBy: null});
	}
});

trpc.onEntryUpdated.subscribe(undefined, {
	onData: (updatedEntry) => {
		if (!auth.isLoggedIn()) {return;}
		mainPage.updateEntry(updatedEntry);
	}
});

trpc.onEntryDeleted.subscribe(undefined, {
	onData: ({entryId}) => {
		if (!auth.isLoggedIn()) {return;}
		mainPage.deleteEntry(entryId);
	}
});

