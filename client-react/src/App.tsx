import {useState, useCallback} from "react";
import styled from "styled-components";
import Button from "./Button";
import Table from "./Table";
import FormLogin from "./FormLogin";
import FormAddEdit, {FormAddEditData} from "./FormAddEdit";
import {useBeforeUnload} from "react-router-dom";
import {useAuthentication} from "./useAuthentication";
import {useEntries} from "./useEntries";
import {trpc} from "./trpc";
import "./App.scss";


const Root = styled.div`
	display: flex;
	flex-direction: row;
`;

const Section = styled.section`
	width: 50px;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
`;

const Main = styled.main`
	width: calc(100% - 50px);
`;


type ModalAddEditMode = "closed" | "open-add" | "open-edit";
const defaultModalData = {id: 0, description: "", number: 0};
// let count = 0;


// @1: component
export default function App() {
	// useEffect(() => {
	// 	count++;
	// 	console.log("render", count);
	// });

	const auth = useAuthentication();
	const data = useEntries();

	const [selectedEntryId,  setSelectedEntryId]  = useState(-1);
	const [modalAddEditMode, setModalAddEditMode] = useState<ModalAddEditMode>("closed");
	const [modalAddEditData, setModalAddEditData] = useState(defaultModalData);

	// @2: queries
	// to logout when page closes
	const token = auth.isLoggedIn ? auth.token : undefined;
	const {mutateAsync: logout} = trpc.logout.useMutation();
	useBeforeUnload(useCallback(async () => {
		if (token === undefined) {return;}
		await logout({token});
	}, [token]));

	// get all entries at startup
	trpc.getAllEntries.useQuery(undefined, {
		onSuccess: allEntries => {
			data.setAllEntries(allEntries);
			console.log("All entries sent");
		},
		enabled: auth.isLoggedIn
	});

	// mutations
	const {mutateAsync: lockEntry}   = trpc.lock.useMutation();
	const {mutateAsync: unlockEntry} = trpc.unlock.useMutation();
	const {mutateAsync: insertEntry} = trpc.insertEntry.useMutation();
	const {mutateAsync: updateEntry} = trpc.updateEntry.useMutation();
	const {mutateAsync: deleteEntry} = trpc.deleteEntry.useMutation();

	// on notifications
	trpc.onEntryInserted.useSubscription(undefined, {
		onData: newEntry => {data.appendEntry(newEntry);},
		enabled: auth.isLoggedIn
	});
	trpc.onEntryUpdated.useSubscription(undefined, {
		onData: updatedEntry => {data.updateEntry(updatedEntry);},
		enabled: auth.isLoggedIn
	});
	trpc.onEntryDeleted.useSubscription(undefined, {
		onData: ({deletedEntryId}) => {data.deleteEntry(deletedEntryId);},
		enabled: auth.isLoggedIn
	});


	// @2: authentication dialog
	if (!auth.isLoggedIn) {
		return (
			<FormLogin/>
		);
	}

	// @2: main window
	return (
		<Root>
			<Section>
				<Button iconClass="fas fa-plus"       onClick={handleAddEntry}/>
				<Button iconClass="fas fa-pencil-alt" onClick={handleUpdateEntry}/>
				<Button iconClass="fas fa-minus"      onClick={handleDeleteEntry}/>
			</Section>
			<Main>
				<Table
					entries={data.entries}
					onHeaderClicked={deselectAllRows}
					onBodyRowClicked={selectRow}
					selectedId={selectedEntryId}
				/>
			</Main>
			<FormAddEdit
				isOpen={modalAddEditMode != "closed"}
				initialData={modalAddEditData}
				onOk={handleAddEditOk}
				onCancel={handleAddEditCancel}
			/>
		</Root>
	);


	// @2: row selection
	function selectRow(id: number) {
		setSelectedEntryId(id);
	}

	function deselectAllRows() {
		setSelectedEntryId(-1);
	}

	// @2: add/edit dialog callbacks
	async function handleAddEditCancel(entryId: number) {
		try {
			if (modalAddEditMode === "open-edit") {
				// unlock the entry being edited
				if (token === undefined) {throw new Error(`A token is needed to unlock an entry`);}
				await unlockEntry({entryId: entryId, token});
			}
		}
		catch (error) {
			alert(error);
		}
		finally {
			// close and reset everything
			setModalAddEditMode("closed");
			setModalAddEditData(defaultModalData);
		}
	}

	async function handleAddEditOk(newData: FormAddEditData) {
		if (modalAddEditMode === "open-add") {
			await handleAddOk(newData);
		}
		else if (modalAddEditMode === "open-edit") {
			await handleEditOk(newData);
		}
	}

	async function handleAddOk(newData: FormAddEditData) {
		try {
			await insertEntry(newData);
		}
		catch (error) {
			alert(error);
		}
		finally {
			setModalAddEditMode("closed");
			setModalAddEditData(defaultModalData);
		}
	}

	async function handleEditOk(newData: FormAddEditData) {
		try {
			// update the entry and unlock it
			if (token === undefined) {throw new Error(`A token is needed to update an entry`);}
			await updateEntry({...newData, token});
			await unlockEntry({entryId: newData.id, token});
		}
		catch (error) {
			alert(error);
		}
		finally {
			setModalAddEditMode("closed");
			setModalAddEditData(defaultModalData);
		}
	}

	// @2: add/edit/delete buttons callbacks
	function handleAddEntry() {
		setModalAddEditMode("open-add");
		setModalAddEditData(defaultModalData);
	}

	async function handleUpdateEntry() {
		let selectedEntry = data.entries.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		try {
			// lock the entry to update
			if (token === undefined) {throw new Error(`A token is needed to lock an entry`);}
			await lockEntry({entryId: selectedEntry.id, token});

			// fill and show the dialog data
			setModalAddEditMode("open-edit");
			setModalAddEditData({id: selectedEntry.id, description: selectedEntry.description, number: selectedEntry.number});
		}
		catch (error) {
			alert(error);
		}
	}

	async function handleDeleteEntry() {
		let selectedEntry = data.entries.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		try {
			// lock the entry and send the delete request
			if (token === undefined) {throw new Error(`A token is needed to lock & delete an entry`);}
			await lockEntry({entryId: selectedEntryId, token});
			await deleteEntry({entryId: selectedEntryId, token});
		}
		catch (error) {
			alert(error);
		}
	}
}

