import {useState} from "react";
import styled from "styled-components";
import Button from "./Button";
import Table from "./Table";
import FormLogin from "./FormLogin";
import FormAddEdit, {FormAddEditData} from "./FormAddEdit";
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
	// get all entries at startup
	trpc.getAllEntries.useQuery(undefined, {
		onSuccess: allEntries => {
			data.setAllEntries(allEntries);
			console.log("All entries sent");
		},
		enabled: auth.isLoggedIn
	});

	// to get the token
	const qRegister = trpc.login.useQuery({username: auth.username, password: auth.password}, {
		onSuccess: data => {console.log(`Token received: ${data.token}`);},
		enabled: auth.isLoggedIn
	});
	const token = qRegister.data?.token;

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

	// mutations
	const qLockEntry = trpc.lock.useMutation();
	const qUnlockEntry = trpc.unlock.useMutation();
	const qInsertEntry = trpc.insertEntry.useMutation();
	const qUpdateEntry = trpc.updateEntry.useMutation();
	const qDeleteEntry = trpc.deleteEntry.useMutation();


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
				await qUnlockEntry.mutate({entryId: entryId, token});
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
			await qInsertEntry.mutateAsync(newData);
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
			await qUpdateEntry.mutateAsync({...newData, token});
			await qUnlockEntry.mutateAsync({entryId: newData.id, token});
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
			await qLockEntry.mutateAsync({entryId: selectedEntry.id, token});

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
			await qLockEntry.mutateAsync({entryId: selectedEntryId, token});
			await qDeleteEntry.mutateAsync({entryId: selectedEntryId, token});
		}
		catch (error) {
			alert(error);
		}
	}
}

