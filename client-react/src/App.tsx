import {useState, useEffect, useCallback} from "react";
import styled from "styled-components";
import Button from "./Button";
import Table from "./Table";
import FormLogin from "./FormLogin";
import FormAddEdit, {FormAddEditData} from "./FormAddEdit";
import {useAuthentication} from "./useAuthentication";
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

	const [selectedEntryId,  setSelectedEntryId]  = useState(-1);
	const [modalAddEditMode, setModalAddEditMode] = useState<ModalAddEditMode>("closed");
	const [modalAddEditData, setModalAddEditData] = useState(defaultModalData);

	const qGetAllEntries = trpc.getAllEntries.useQuery(undefined, {
		onSuccess: allEntries => {console.log("all data sent");},
		enabled: auth.isLoggedIn
	})
	// const qLockEntry     = trpc.lock.useMutation();
	// const qUnlockEntry   = trpc.unlock.useMutation();
	// const qInsertEntry   = trpc.insertEntry.useMutation();
	// const qUpdateEntry   = trpc.updateEntry.useMutation();
	// const qDeleteEntry   = trpc.deleteEntry.useMutation();

	// const wsConnecCond = (validatedLogin !== null && validatedLogin !== "");
	// const host = (window.location.hostname.length > 0 ? window.location.hostname : "localhost");

	// const onWsOpen = useCallback(() => {console.log("connected!");}, []);
	// const onWsError = useCallback(error => {console.log("Error: " + error);}, []);
	// const onWsClose = useCallback(() => {console.log("disconnected!");}, []);

	// const onWsMessage = useCallback(dataStr => {
	// 	let data = JSON.parse(dataStr);

	// 	if (data.type === "insert") {appendEntry(data.entry);}
	// 	else if (data.type === "update") {updateEntry(data.entry);}
	// 	else if (data.type === "delete") {deleteEntry(data.id);}
	// 	else if (Array.isArray(data)) {setAllEntries(data);}
	// 	else if (data.type === "lock") {
	// 		if (data.status !== "success") {
	// 			alert(`Lock request failed:\n${data.msg}`);
	// 			setModalAddEditOpen(false);
	// 			setModalAddEditMode("");
	// 			setModalAddEditData(defaultModalData);
	// 		}
	// 		// else if (data.id === modalAddEditData.id && modalAddEditMode === "edit") {
	// 		// 	setModalAddEditOpen(true); // if we wait the lock confirmation to show the dialog
	// 		// }
	// 	}
	// 	else if (data.type === "unlock") {
	// 		if (data.status !== "success") {
	// 			alert(`Unlock request failed:\n${data.msg}`);
	// 		}
	// 	}
	// },[setAllEntries, appendEntry, updateEntry, deleteEntry]);

	// const [isConnected, sendWsText, sendWsJson] = useWebSocket(
	// 	"ws://" + host + ":1234", wsConnecCond,
	// 	onWsOpen, onWsMessage, onWsError, onWsClose
	// );

	// useEffect(() => {
	// 	if (!isConnected) {return;}
	// 	sendWsJson({userName: validatedLogin});
	// }, [isConnected,sendWsJson]);

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
					entries={qGetAllEntries.data || []}
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
			// await qUnlockEntry.mutate({entryId: entryId, token: "token"});
		}

		// close and reset everything
		setModalAddEditMode("closed");
		setModalAddEditData(defaultModalData);
	}

	async function handleAddEditOk(newData: FormAddEditData) {
		if (modalAddEditMode === "open-add") {
			const data = {description: newData.description, number: newData.number};
			// await qInsertEntry.mutateAsync(data);
		}
		else if (modalAddEditMode === "open-edit") {
			// update the entry and unlock it
			// await qUpdateEntry.mutateAsync({...newData, token: "token"});
			// await qUnlockEntry.mutateAsync({entryId: newData.id, token: "token"});
		}

		setModalAddEditMode("closed");
		setModalAddEditData(defaultModalData);
	}

	function handleAddEntry() {
		setModalAddEditMode("open-add");
		setModalAddEditData(defaultModalData);
	}

	async function handleUpdateEntry() {
		let selectedEntry = qGetAllEntries.data?.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		// lock the entry to update
		// await qLockEntry.mutateAsync({entryId: selectedEntry.id, token: "token"});

		// fill and show the dialog data
		setModalAddEditMode("open-edit");
		setModalAddEditData({id: selectedEntry.id, description: selectedEntry.description, number: selectedEntry.number});
	}

	async function handleDeleteEntry() {
		let selectedEntry = qGetAllEntries.data?.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		// lock the entry and send the delete request
		// await qLockEntry.mutateAsync({entryId: selectedEntryId, token: "token"});
		// await qDeleteEntry.mutateAsync({entryId: selectedEntryId, token: "token"});
	}
}

