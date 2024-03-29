import {db} from "./db";
import {entries} from "./schema";
import {Entry} from "./types";
import {eq} from "drizzle-orm";

type EntryWithoutLastModif = Omit<Entry, "lastModif">;
type NewEntry = {description: string, number?: number};


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
export async function updateEntry(newValue: EntryWithoutLastModif): Promise<Entry> {
	const result = await db
		.update(entries)
		.set({description: newValue.description, number: newValue.number})
		.where(eq(entries.id, newValue.id))
		.returning();

	if (result.length !== 1) {throw new Error(`No entry with id=${newValue.id}`);}
	return result[0];
}


// @1: INSERT
export async function insertEntry(newEntry: NewEntry): Promise<Entry> {
	const padWithZero = (x: number): string => (x < 10 ? `0${x.toString()}` : x.toString());
	const date = new Date();
	const lastModif = `${date.getFullYear()}-${padWithZero(date.getMonth()+1)}-${padWithZero(date.getDate())} ${padWithZero(date.getHours())}:${padWithZero(date.getMinutes())}:${padWithZero(date.getSeconds())}`;

	const result = await db
		.insert(entries)
		.values({...newEntry, lastModif})
		.returning();

	if (result.length !== 1) {throw new Error(`Insert entry: internal error`);}
	return result[0];
}


// @1: DELETE
export async function deleteEntry(entryId: number): Promise<void> {
	const result = await db
		.delete(entries)
		.where(eq(entries.id, entryId));

	if (result.changes !== 1) {throw new Error(`Failed to delete entry #${entryId}`);}
}

