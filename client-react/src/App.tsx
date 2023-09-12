import {useState, useEffect, useCallback} from "react";
import styled from "styled-components";
import Button from "./Button";
import Table from "./Table";
import FormLogin from "./FormLogin";
import FormAddEdit from "./FormAddEdit";
import useMemorization from "./useMemorization";
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


let defaultModalData = {id: 0, description: "", number: 0};
// let count = 0;


export default function App() {
	// useEffect(() => {
	// 	count++;
	// 	console.log("render", count);
	// });

	const [login,            setLogin]            = useState("");
	const [modalLoginOpen,   setModalLoginOpen]   = useState(true);
	const [selectedEntryId,  setSelectedEntryId]  = useState(-1);
	const [modalAddEditOpen, setModalAddEditOpen] = useState(false);
	const [modalAddEditMode, setModalAddEditMode] = useState("");
	const [modalAddEditData, setModalAddEditData] = useState(defaultModalData);

	const qGetAllEntries = trpc.getAllEntries.useQuery();
	const qLockEntry     = trpc.lock.useMutation();
	const qUnlockEntry   = trpc.unlock.useMutation();
	const qInsertEntry   = trpc.insertEntry.useMutation();
	const qUpdateEntry   = trpc.updateEntry.useMutation();
	const qDeleteEntry   = trpc.deleteEntry.useMutation();

	const validatedLogin = useMemorization(login, modalLoginOpen);
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
	const isConnected = false;


	return (
		<Root>
			<Section>
				<Button iconClass="fas fa-plus"       disabled={!isConnected} onClick={handleAddEntry}/>
				<Button iconClass="fas fa-pencil-alt" disabled={!isConnected} onClick={handleUpdateEntry}/>
				<Button iconClass="fas fa-minus"      disabled={!isConnected} onClick={handleDeleteEntry}/>
			</Section>
			<Main>
				<Table
					entries={qGetAllEntries.data || []}
					onHeaderClicked={deselectAllRows}
					onBodyRowClicked={selectRow}
					selectedId={selectedEntryId}
				/>
			</Main>
			<FormLogin
				isOpen={modalLoginOpen}
				login={login}
				setLogin={setLogin}
				onOk={() => setModalLoginOpen(false)}
			/>
			<FormAddEdit
				isOpen={modalAddEditOpen}
				data={modalAddEditData}
				setData={setModalAddEditData}
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

	async function handleAddEditCancel() {
		if (modalAddEditMode === "edit") {
			// unlock the entry being edited
			await qUnlockEntry.mutate({entryId: modalAddEditData.id, token: "token"});
		}

		// close and reset everything
		setModalAddEditOpen(false);
		setModalAddEditMode("");
		setModalAddEditData(defaultModalData);
	}

	async function handleAddEditOk() {
		// remark: the input (i.e. modalAddEditData) is checked inside the dialog
		setModalAddEditOpen(false);

		if (modalAddEditMode === "add") {
			let data = {description: modalAddEditData.description, number: modalAddEditData.number};
			await qInsertEntry.mutateAsync(data);
		}
		else if (modalAddEditMode === "edit") {
			// update the entry and unlock it
			await qUpdateEntry.mutateAsync({...modalAddEditData, token: "token"});
			await qUnlockEntry.mutateAsync({entryId: modalAddEditData.id, token: "token"});
		}

		setModalAddEditMode("");
		setModalAddEditData(defaultModalData);
	}

	function handleAddEntry() {
		setModalAddEditOpen(true);
		setModalAddEditMode("add");
		setModalAddEditData(defaultModalData);
	}

	async function handleUpdateEntry() {
		let selectedEntry = qGetAllEntries.data?.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		// lock the entry to update
		await qLockEntry.mutateAsync({entryId: selectedEntry.id, token: "token"});

		// fill and show the dialog data
		setModalAddEditMode("edit");
		setModalAddEditData({id: selectedEntry.id, description: selectedEntry.description, number: selectedEntry.number});
		setModalAddEditOpen(true);
	}

	async function handleDeleteEntry() {
		let selectedEntry = qGetAllEntries.data?.find(e => e.id === selectedEntryId);
		if (!selectedEntry) {return;}

		// lock the entry and send the delete request
		await qLockEntry.mutateAsync({entryId: selectedEntryId, token: "token"});
		await qDeleteEntry.mutateAsync({entryId: selectedEntryId, token: "token"});
	}
}

