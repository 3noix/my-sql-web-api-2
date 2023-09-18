import {trpc, ee} from "./trpc";
import {observable} from "@trpc/server/observable";
import {z} from "zod";
import {randomUUID} from "crypto";
import * as q from "./db/queries";
import {entryAndLockSchema} from "./types";
import {Entry, entrySchema} from "./db/types";
import {env} from "./environment";


// @2: internal data and helper functions
const sessions = new Map<string,{username: string, expired: NodeJS.Timeout}>(); // key = token (uuid), value = user name
const lockers = new Map<number,string>(); // key = entry id, value = token

function removeToken(input: {token: string}): boolean {
	if (env.trpc.logProcCalls) {console.log(`Removing token: ${input.token}`);}
	const session = sessions.get(input.token);
	if (session !== undefined) {clearTimeout(session.expired);}

	let count = 0;
	if (sessions.delete(input.token)) {count++;}

	for (const [entryId, token] of lockers.entries()) {
		if (token === input.token) {
			lockers.delete(entryId);
			ee.emit("unlocked", {entryId});
			count++;
		}
	}

	ee.emit("logged-out", input.token);
	return (count > 0);
}

function tokenHasLockOn(input: {entryId: number, token: string}): boolean {
	return lockers.get(input.entryId) === input.token;
}


// @1: LOGIN / LOGOUT
const login = trpc.procedure
	.input(z.object({
		username: z.string().min(2),
		password: z.string().min(2),
	}))
	.output(z.object({
		token: z.string().uuid()
	}))
	.mutation(req => {
		if (env.trpc.logProcCalls) {console.log(`login: name=${req.input.username}`);}
		const token = randomUUID();
		sessions.set(token, {
			username: req.input.username,
			expired: setTimeout(() => removeToken({token}), env.trpc.tokenExpirationTimeMs)
		});
		return {token};
	});

const logout = trpc.procedure
	.input(z.object({
		token: z.string().uuid()
	}))
	.mutation(req => {
		if (env.trpc.logProcCalls) {console.log(`logout: token=${req.input.token}`);}
		const token = req.input.token;
		const tokenExisted = removeToken({token});
		// if (!tokenExisted) {throw new Error("Unregistered token");}
	});

const onLoggedOut = trpc.procedure
	.input(z.object({
		token: z.string().uuid()
	}))
	.subscription(({input}) => {
		return observable<string>(emit => {
			const cb = (token: string) => {if (token === input.token) {emit.next(token);}};
			ee.on("logged-out", cb);
			return () => {ee.off("logged-out", cb)};
		});
	});


// @1: LOCK / UNLOCK
const lock = trpc.procedure
	.input(z.object({
		entryId: z.number(),
		token: z.string().uuid()
	}))
	.output(z.boolean())
	.mutation(req => {
		if (env.trpc.logProcCalls) {console.log(`lock: id=${req.input.entryId}`);}

		// check this token has been attributed
		if (!sessions.has(req.input.token)) {
			throw new Error(`Unknown token: ${req.input.token}`);
		}

		// check if not already locked
		const tokenLocking = lockers.get(req.input.entryId);
		if (tokenLocking !== undefined) {
			const userLockingData = sessions.get(tokenLocking);
			const userNameLocking = userLockingData?.username || "??";
			throw new Error(`The id #${req.input.entryId} is already locked by ${userNameLocking}`);
		}

		// lock it
		const username = sessions.get(req.input.token)?.username || "??";
		lockers.set(req.input.entryId, req.input.token);
		ee.emit("locked", {entryId: req.input.entryId, username});
		return true;
});

const onEntryLocked = trpc.procedure.subscription(() => {
	return observable<{entryId: number, username: string}>(emit => {
		ee.on("locked", emit.next);
		return () => {ee.off("locked", emit.next)};
	});
});

const unlock = trpc.procedure
	.input(z.object({
		entryId: z.number(),
		token: z.string().uuid()
	}))
	.output(z.boolean())
	.mutation(req => {
		if (env.trpc.logProcCalls) {console.log(`unlock: id=${req.input.entryId}`);}

		// check if actually locked
		const tokenLocking = lockers.get(req.input.entryId);
		if (tokenLocking === undefined) {throw new Error(`The id #${req.input.entryId} is not locked`);}

		// check it is locked by this token
		if (tokenLocking !== req.input.token) {throw new Error(`The id #${req.input.entryId} is not locked from this token`);}

		// unlock it
		lockers.delete(req.input.entryId);
		ee.emit("unlocked", {entryId: req.input.entryId});
		return true;
});

const onEntryUnlocked = trpc.procedure.subscription(() => {
	return observable<{entryId: number}>(emit => {
		ee.on("unlocked", emit.next);
		return () => {ee.off("unlocked", emit.next)};
	});
});


// @1: SELECT
const getAllEntries = trpc.procedure
	.output(z.array(entryAndLockSchema))
	.query(async req => {
		if (env.trpc.logProcCalls) {console.log(`getAllEntries`);}
		const entries = await q.getAllEntries();
		return entries.map(e => {
			const tokenLocking = lockers.get(e.id);
			const username = (tokenLocking !== undefined) ? (sessions.get(tokenLocking)?.username || null) : null;
			return {...e, lockedBy: username};
		});
	});


// @1: INSERT
const insertEntry = trpc.procedure
	.input(z.object({
		description: z.string(),
		number: z.number()
	}))
	.output(z.object({
		inserted: entrySchema
	}))
	.mutation(async req => {
		if (env.trpc.logProcCalls) {console.log(`insert: description=${req.input.description}, number=${req.input.number}`);}
		const insertedEntry = await q.insertEntry(req.input);
		ee.emit("inserted", insertedEntry);
		return {inserted: insertedEntry};
	});

const onEntryInserted = trpc.procedure.subscription(() => {
	return observable<Entry>(emit => {
		ee.on("inserted", emit.next);
		return () => {ee.off("inserted", emit.next)};
	});
});


// @1: UPDATE
const updateEntry = trpc.procedure
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
		if (env.trpc.logProcCalls) {console.log(`update: id=${req.input.id}`);}

		// check this entry is locked by this token
		if (!tokenHasLockOn({entryId: req.input.id, token: req.input.token})) {
			throw new Error(`You need to lock entry #${req.input.id} to update it!`);
		}

		// update it and notifies
		const updatedEntry = await q.updateEntry(req.input);
		ee.emit("updated", updatedEntry);
		return {updated: updatedEntry};
	});

const onEntryUpdated = trpc.procedure.subscription(() => {
	return observable<Entry>(emit => {
		ee.on("updated", emit.next);
		return () => {ee.off("updated", emit.next)};
	});
});


// @1: DELETE
const deleteEntry = trpc.procedure
	.input(z.object({
		entryId: z.number(),
		token: z.string().uuid()
	}))
	.output(z.object({
		entryId: z.number()
	}))
	.mutation(async req => {
		if (env.trpc.logProcCalls) {console.log(`delete: id=${req.input.entryId}`);}

		// check this entry is locked by this token
		if (!tokenHasLockOn({entryId: req.input.entryId, token: req.input.token})) {
			throw new Error(`You need to lock entry #${req.input.entryId} to delete it!`);
		}

		// delete it, delete the associated lock and notifies
		await q.deleteEntry(req.input.entryId);
		lockers.delete(req.input.entryId);
		ee.emit("deleted", {entryId: req.input.entryId});
		return {entryId: req.input.entryId};
	});

const onEntryDeleted = trpc.procedure.subscription(() => {
	return observable<{entryId: number}>(emit => {
		ee.on("deleted", emit.next);
		return () => {ee.off("deleted", emit.next)};
	});
});


// @2: ROUTER
export const router = trpc.router({
	login,
	logout,
	onLoggedOut,
	lock,
	unlock,
	onEntryLocked,
	onEntryUnlocked,
	getAllEntries,
	insertEntry,
	updateEntry,
	deleteEntry,
	onEntryInserted,
	onEntryUpdated,
	onEntryDeleted
});

export type Router = typeof router;
