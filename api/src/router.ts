import {trpc} from "./trpc";
import {connect, disconnect, lock, unlock, getAllEntries, getEntryById, insertEntry, updateEntry, deleteEntry} from "./procedures";


export const router = trpc.router({
	connect,
	disconnect,
	lock,
	unlock,
	getAllEntries,
	getEntryById,
	insertEntry,
	updateEntry,
	deleteEntry
});


export type Router = typeof router;

