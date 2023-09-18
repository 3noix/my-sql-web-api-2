import {useState, useCallback} from "react";
import {Entry} from "../../api-express-drizzle/src/db/types";
import {EntryAndLock} from "../../api-express-drizzle/src/types";


export function useEntries() {
	const [entries, setEntries] = useState<EntryAndLock[]>([]);

	const appendEntry = useCallback((newEntry: EntryAndLock) => {
		setEntries(prevEntries => [...prevEntries, newEntry]);
	}, []);

	const updateEntry = useCallback((updatedEntry: Entry) => {
		setEntries(prevEntries => prevEntries.map(
			e => {
				if (e.id !== updatedEntry.id) {return e;} // no modif
				return {
					id: e.id,
					description: updatedEntry.description,
					number: updatedEntry.number,
					lastModif: updatedEntry.lastModif,
					lockedBy: e.lockedBy
				};
			}
		));
	}, []);

	const deleteEntry = useCallback((entryId: number) => {
		setEntries(prevEntries => prevEntries.filter(e => e.id !== entryId));
	}, []);

	const lockEntry = useCallback((entryId: number, lockedBy: string) => {
		setEntries(prevEntries => prevEntries.map(e => {
			if (e.id !== entryId) {return e;} // no modif
			return {...e, lockedBy};
		}));
	}, []);

	const unlockEntry = useCallback((entryId: number) => {
		setEntries(prevEntries => prevEntries.map(e => {
			if (e.id !== entryId) {return e;} // no modif
			return {...e, lockedBy: null};
		}));
	}, []);

	const setAllEntries = useCallback((data: EntryAndLock[]) => {
		setEntries(data);
	}, []);

	return {entries, setAllEntries, appendEntry, updateEntry, deleteEntry, lockEntry, unlockEntry};
}

