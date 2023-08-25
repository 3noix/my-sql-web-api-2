import {db} from "./db";
import {entries} from "./schema";
import {Entry, NewEntry} from "./types";
import {eq, sql} from "drizzle-orm";

type EntryWithoutLastModif = Omit<Entry, "lastModif">;


// @1: SELECT
export async function getAllEntries(): Promise<Entry[]> {
	return await db
		.select()
		.from(entries);
}

export async function getEntryById(entryId: number): Promise<Entry> {
	const result = await db
		.select()
		.from(entries)
		.where(eq(entries.id, entryId));

	if (result.length !== 1) {throw new Error(`No entry with id=${entryId}`);}
	return result[0];
}


// @1: UPDATE
export async function updateEntry(newValue: EntryWithoutLastModif): Promise<void> {
	await db
		.update(entries)
		.set({description: newValue.description, number: newValue.number})
		.where(eq(entries.id, newValue.id));
}

export async function updateEntryAndReturns(newValue: EntryWithoutLastModif): Promise<Entry> {
	return await db.transaction(async (tx) => {
		const res1 = await tx
			.update(entries)
			.set({description: newValue.description, number: newValue.number})
			.where(eq(entries.id, newValue.id));

		if (res1[0].affectedRows !== 1) {throw new Error(`No entry with id=${newValue.id}`);}
		const res2 = await tx
			.select()
			.from(entries)
			.where(eq(entries.id, newValue.id));

		if (res2.length !== 1) {throw new Error(`No entry with id=${newValue.id}`);}
		return res2[0];
	});
}


// @1: INSERT
export async function insertEntry(newEntry: NewEntry): Promise<void> {
	await db
		.insert(entries)
		.values(newEntry);
}

export async function insertEntryAndReturns(newEntry: NewEntry): Promise<Entry> {
	return await db.transaction(async (tx) => {
		const res1 = await tx
			.insert(entries)
			.values(newEntry);

		if (res1[0].affectedRows !== 1) {throw new Error("Failed to insert entry");}
		const res2 = await tx
			.select()
			.from(entries)
			.where(sql`${entries.id} = last_insert_id()`);
	
		if (res2.length !== 1) {throw new Error("Failed to fetch the last inserted entry");}
		return res2[0];
	});
}


// @1: DELETE
export async function deleteEntry(entryId: number): Promise<void> {
	const res = await db
		.delete(entries)
		.where(eq(entries.id, entryId));

	if (res[0].affectedRows !== 1) {throw new Error(`Failed to delete entry #${entryId}`);}
}

