import {trpc} from "./trpc";
import {z} from "zod";
import {randomUUID} from "crypto";
import * as q from "./db/queries";
import {entrySchema} from "./db/types";

const debug = false;
const tokenExpirationTimeMs = 2 * 60 * 60 * 1000;


// @2: internal data and helper functions
const sessions = new Map<string,{userName: string, expired: NodeJS.Timeout}>(); // key = token (uuid), value = user name
const lockers = new Map<number,string>(); // key = entry id, value = token

function removeToken(input: {token: string}): boolean {
	const session = sessions.get(input.token);
	if (session !== undefined) {clearTimeout(session.expired);}

	let count = 0;
	if (sessions.delete(input.token)) {count++;}

	for (const [entryId, token] of lockers.entries()) {
		if (token === input.token) {
			lockers.delete(entryId);
			count++;
		}
	}

	return (count > 0);
}

function tokenHasLockOn(input: {entryId: number, token: string}): boolean {
	return lockers.get(input.entryId) === input.token;
}


// @1: CONNECT / DISCONNECT
export const connect = trpc.procedure
	.input(z.object({
		name: z.string().min(2)
	}))
	.output(z.object({
		token: z.string().uuid()
	}))
	.query(req => {
		if (debug) {console.log(`connect: name=${req.input.name}`);}
		const token = randomUUID();
		sessions.set(token, {
			userName: req.input.name,
			expired: setTimeout(() => removeToken({token}), tokenExpirationTimeMs)
		});
		return {token};
	});

export const disconnect = trpc.procedure
	.input(z.object({
		token: z.string().uuid()
	}))
	.query(req => {
		if (debug) {console.log(`disconnect: token=${req.input.token}`);}
		const token = req.input.token;
		const tokenExisted = removeToken({token});
		// if (!tokenExisted) {throw new Error("No active connection linked to this token");}
	});


// @1: LOCK / UNLOCK
export const lock = trpc.procedure
	.input(z.object({
		entryId: z.number(),
		token: z.string().uuid()
	}))
	.output(z.boolean())
	.query(req => {
		if (debug) {console.log(`lock: id=${req.input.entryId}`);}

		// check if not already locked
		const tokenLocking = lockers.get(req.input.entryId);
		if (tokenLocking !== undefined) {
			const userLockingData = sessions.get(tokenLocking);
			const userNameLocking = userLockingData?.userName || "??";
			throw new Error(`The id #${req.input.entryId} is already locked by ${userNameLocking}`);
		}

		// lock it
		lockers.set(req.input.entryId, req.input.token);
		return true;
});

export const unlock = trpc.procedure
	.input(z.object({
		entryId: z.number(),
		token: z.string().uuid()
	}))
	.output(z.boolean())
	.query(req => {
		if (debug) {console.log(`unlock: id=${req.input.entryId}`);}

		// check if actually locked
		const tokenLocking = lockers.get(req.input.entryId);
		if (tokenLocking === undefined) {throw new Error(`The id #${req.input.entryId} is not locked`);}

		// check it is locked by this token
		if (tokenLocking !== req.input.token) {throw new Error(`The id #${req.input.entryId} is not locked from this token`);}

		// unlock it
		lockers.delete(req.input.entryId);
		return true;
});


// @1: SELECT
export const getAllEntries = trpc.procedure
	.output(z.array(entrySchema))
	.query(async req => {
		if (debug) {console.log(`getAllEntries`);}
		const entries = await q.getAllEntries();
		return entries;
	});

export const getEntryById = trpc.procedure
	.input(z.object({
		entryId: z.number()
	}))
	.output(entrySchema)
	.query(async req => {
		if (debug) {console.log(`getEntry: id=${req.input.entryId}`);}
		const entry = await q.getEntryById(req.input.entryId);
		return entry;
	});


// @1: INSERT
export const insertEntry = trpc.procedure
	.input(z.object({
		description: z.string(),
		number: z.number()
	}))
	.output(z.object({
		inserted: entrySchema
	}))
	.mutation(async req => {
		if (debug) {console.log(`insert: description=${req.input.description}, number=${req.input.number}`);}
		const insertedEntry = await q.insertEntryAndReturns(req.input);
		// TODO: notify all connected users
		return {inserted: insertedEntry};
	});


// @1: UPDATE
export const updateEntry = trpc.procedure
	.input(z.object({
		id: z.number(),
		description: z.string(),
		number: z.number(),
		token: z.string().uuid()
	}))
	.output(z.object({
		updated: entrySchema
	}))
	.mutation(async req => {
		if (debug) {console.log(`update: id=${req.input.id}`);}

		// check this entry is locked by this token
		if (!tokenHasLockOn({entryId: req.input.id, token: req.input.token})) {
			throw new Error(`You need to lock entry #${req.input.id} to update it!`);
		}

		// update it and notifies
		const updatedEntry = await q.updateEntryAndReturns(req.input);
		// TODO: notify all connected users
		return {updated: updatedEntry};
	});


// @1: DELETE
export const deleteEntry = trpc.procedure
	.input(z.object({
		entryId: z.number(),
		token: z.string().uuid()
	}))
	.output(z.object({
		deletedEntryId: z.number()
	}))
	.mutation(async req => {
		if (debug) {console.log(`delete: id=${req.input.entryId}`);}

		// check this entry is locked by this token
		if (!tokenHasLockOn({entryId: req.input.entryId, token: req.input.token})) {
			throw new Error(`You need to lock entry #${req.input.entryId} to delete it!`);
		}

		// delete it, delete the associated lock and notifies
		await q.deleteEntry(req.input.entryId);
		lockers.delete(req.input.entryId);
		// TODO: notify all connected users
		return {deletedEntryId: req.input.entryId};
	});