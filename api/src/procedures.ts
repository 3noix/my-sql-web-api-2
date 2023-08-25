import {trpc} from "./trpc";
import {z} from "zod";
import {randomUUID} from "crypto";
import * as q from "./db/queries";


// @2: internal data and helper functions
const sessions = new Map<string,string>(); // key = token (uuid), value = user name
const lockers = new Map<number,{token: string, userName: string}>(); // key = entry id, value = token and user name

function removeToken(input: {token: string}): boolean {
	let count = 0;
	const tokenWasInSessionsMap = sessions.delete(input.token);
	if (tokenWasInSessionsMap) {count++;}

	for (const [entryId, session] of lockers.entries()) {
		if (session.token === input.token) {
			lockers.delete(entryId);
			count++;
		}
	}

	return (count > 0);
}

function tokenHasLockOn(input: {entryId: number, token: string}): boolean {
	return lockers.get(input.entryId)?.token === input.token;
}


// @1: CONNECT / DISCONNECT
export const connect = trpc.procedure
	.input(z.object({name: z.string().min(2)}))
	.output(z.object({token: z.string().uuid()}))
	.query(req => {
		const token = randomUUID();
		sessions.set(token, req.input.name);
		return {token};
	});

export const disconnect = trpc.procedure
	.input(z.object({token: z.string().uuid()}))
	.query(req => {
		const token = req.input.token;
		const tokenExisted = removeToken({token});
		// if (!tokenExisted) {throw new Error("No active connection linked to this token");}
	});


// @1: LOCK / UNLOCK
export const lock = trpc.procedure
	.input(z.object({entryId: z.number(), token: z.string().uuid()}))
	.output(z.boolean())
	.query(req => {
		const userLocking = lockers.get(req.input.entryId);
		if (userLocking !== undefined) {throw new Error(`The id #${req.input.entryId} is already locked by ${userLocking.userName}`);}

		const userName = sessions.get(req.input.token);
		if (userName === undefined) {throw new Error(`Server internal error: token referenced in lockers but not in sessions`);}

		lockers.set(req.input.entryId, {token: req.input.token, userName});
		return true;
});

export const unlock = trpc.procedure
	.input(z.object({entryId: z.number(), token: z.string().uuid()}))
	.output(z.boolean())
	.query(req => {
		const userLocking = lockers.get(req.input.entryId);
		if (userLocking === undefined) {throw new Error(`The id #${req.input.entryId} is not locked`);}

		if (userLocking.token !== req.input.token) {throw new Error(`The id #${req.input.entryId} is not locked from this token`);}

		lockers.delete(req.input.entryId);
		return true;
});


// @1: SELECT
export const getAllEntries = trpc.procedure
	.output(z.array(z.object({
		id: z.number(),
		description: z.string(),
		number: z.number(),
		lastModif: z.string().regex(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
	})))
	.query(async req => {
		const entries = await q.getAllEntries();
		return entries;
	});

export const getEntryById = trpc.procedure
	.input(z.object({entryId: z.number()}))
	.output(z.object({
		id: z.number(),
		description: z.string(),
		number: z.number(),
		lastModif: z.string().regex(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
	}))
	.query(async req => {
		const entry = await q.getEntryById(req.input.entryId);
		return entry;
	});


// @1: INSERT
// TODO: to implement
export const insertEntry = trpc.procedure
	.input(z.number())
	.output(z.number())
	.mutation(async req => {
		return 0;
	});


// @1: UPDATE
// TODO: to implement
export const updateEntry = trpc.procedure
	.input(z.number())
	.output(z.number())
	.mutation(async req => {
		return 0;
	});


// @1: DELETE
// TODO: to implement
export const deleteEntry = trpc.procedure
	.input(z.number())
	.output(z.number())
	.mutation(async req => {
		return 0;
	});
