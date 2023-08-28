import {trpc} from "./trpc";
import {register, unregister, lock, unlock} from "./procedures";
import {getAllEntries, getEntryById} from "./procedures";
import {insertEntry, onInsert, updateEntry, onUpdate, deleteEntry, onDelete} from "./procedures";


export const router = trpc.router({
	register,
	unregister,
	lock,
	unlock,
	getAllEntries,
	getEntryById,
	insertEntry,
	updateEntry,
	deleteEntry,
	onInsert,
	onUpdate,
	onDelete
});


export type Router = typeof router;

