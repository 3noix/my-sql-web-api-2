import {useState, useCallback} from "react";
import {Entry} from "../../api/src/db/types";


export default function useEntries() {
	const [entries, setEntries] = useState<Entry[]>([]);

	const appendEntry = useCallback((newEntry: Entry) => {
		setEntries(prevEntries => [...prevEntries, newEntry]);
	},[]);

	const updateEntry = useCallback((updatedEntry: Entry) => {
		setEntries(prevEntries => prevEntries.map(
			e => {
				if (e.id !== updatedEntry.id) {return e;} // no modif
				return {
					id: e.id,
					description: updatedEntry.description,
					number: updatedEntry.number,
					lastModif: updatedEntry.lastModif
				};
			}
		));
	},[]);

	const deleteEntry = useCallback((entryId: number) => {
		setEntries(prevEntries => prevEntries.filter(e => e.id !== entryId));
	},[]);

	const setAllEntries = useCallback((data: Entry[]) => {
		setEntries(data);
	},[]);

	return {entries, setAllEntries, appendEntry, updateEntry, deleteEntry};
}

