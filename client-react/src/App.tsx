import {useState, useEffect, useCallback} from "react";
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

	// get all entries at startup
	trpc.getAllEntries.useQuery(undefined, {
		onSuccess: allEntries => {
			data.setAllEntries(allEntries);
			console.log("All entries sent");
		},
		enabled: auth.isLoggedIn
	});

	// to get the token
	const qRegister = trpc.register.useQuery({name: auth.username}, {
		onSuccess: data => {console.log(`Token received: ${data.token}`);},
		enabled: auth.isLoggedIn
	});
	const token = qRegister.data?.token;

	// on notifications
	trpc.onInsert.useSubscription(undefined, {
		onData: newEntry => {data.appendEntry(newEntry);},
		enabled: auth.isLoggedIn
	});
	trpc.onUpdate.useSubscription(undefined, {
		onData: updatedEntry => {data.updateEntry(updatedEntry);},
		enabled: auth.isLoggedIn
	});
	trpc.onDelete.useSubscription(undefined, {
		onData: ({deletedEntryId}) => {data.deleteEntry(deletedEntryId);},
		enabled: auth.isLoggedIn
	});

	// mutations
	// const qLockEntry     = trpc.lock.useMutation();
	// const qUnlockEntry   = trpc.unlock.useMutation();
	// const qInsertEntry   = trpc.insertEntry.useMutation();
	// const qUpdateEntry   = trpc.updateEntry.useMutation();
	// const qDeleteEntry   = trpc.deleteEntry.useMutation();


	if (!auth.isLoggedIn) {
		return (
			<FormLogin/>
		);
	}

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


	function selectRow(id: number) {
		setSelectedEntryId(id);
	}

	function deselectAllRows() {
		setSelectedEntryId(-1);
	}

	async function handleAddEditCancel(entryId: number) {
		if (modalAddEditMode === "open-edit") {
			// unlock the entry being edited
			// if (token === undefined) {throw new Error(`A token is needed to unlock an entry`);}
			// await qUnlockEntry.mutate({entryId: entryId, token});
		}

		// close and reset everything
		setModalAddEditMode("closed");
		setModalAddEditData(defaultModalData);
	}

	async function handleAddEditOk(newData: FormAddEditData) {
		if (modalAddEditMode === "open-add") {
			// await qInsertEntry.mutateAsync(newData);
		}
		else if (modalAddEditMode === "open-edit") {
			// update the entry and unlock it
			// if (token === undefined) {throw new Error(`A token is needed to update an entry`);}
			// await qUpdateEntry.mutateAsync({...newData, token});
			// await qUnlockEntry.mutateAsync({entryId: newData.id, token});
		}

		setModalAddEditMode("closed");
		setModalAddEditData(defaultModalData);
	}

	function handleAddEntry() {
		setModalAddEditMode("open-add");
		setModalAddEditData(defaultModalData);
	}

	async function handleUpdateEntry() {
		let selectedEntry = data.entries.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		// lock the entry to update
		// if (token === undefined) {throw new Error(`A token is needed to lock an entry`);}
		// await qLockEntry.mutateAsync({entryId: selectedEntry.id, token});

		// fill and show the dialog data
		setModalAddEditMode("open-edit");
		setModalAddEditData({id: selectedEntry.id, description: selectedEntry.description, number: selectedEntry.number});
	}

	async function handleDeleteEntry() {
		let selectedEntry = data.entries.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		// lock the entry and send the delete request
		// if (token === undefined) {throw new Error(`A token is needed to lock & delete an entry`);}
		// await qLockEntry.mutateAsync({entryId: selectedEntryId, token});
		// await qDeleteEntry.mutateAsync({entryId: selectedEntryId, token});
	}
}

