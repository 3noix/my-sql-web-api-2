import {createTRPCProxyClient, createWSClient, splitLink, httpBatchLink, wsLink} from "@trpc/client";
import type {Router} from "../../api-express-drizzle/src/router";
import {Entry} from "../../api-express-drizzle/src/db/types";


const trpc = createTRPCProxyClient<Router>({
	links: [
		splitLink({
			condition: op => {
				return op.type === "subscription";
			},
			true: wsLink({
				client: createWSClient({
					url: "ws://localhost:3000"
				})
			}),
			false: httpBatchLink({
				url: "http://localhost:3000"
			})
		})
	]
});

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}


// @2: MAIN
async function main() {
	await sleep(1000);
	trpc.onEntryLocked.subscribe(undefined,   {onData: onEntryLocked});
	trpc.onEntryUnlocked.subscribe(undefined, {onData: onEntryUnlocked});
	trpc.onEntryInserted.subscribe(undefined, {onData: onEntryInserted});
	trpc.onEntryUpdated.subscribe(undefined,  {onData: onEntryUpdated});
	trpc.onEntryDeleted.subscribe(undefined,  {onData: onEntryDeleted});

	// await testRegister1();
	// await testRegister2();
	// await testLockUnlock1();
	// await testLockUnlock2();
	// await testGetAllEntries();
	// await testGetEntryById();
	// await testInsertEntry();
	// await testUpdateEntry1();
	// await testUpdateEntry2();
	await testDeleteEntry1();
	// await testDeleteEntry2();
	// await sleep(5000);
}

main();


// @2: CALLBACKS OF NOTIFICATIONS
function onEntryLocked(input: {entryId: number}): void {
	console.log(`--> entry locked: ${input.entryId}`);
}

function onEntryUnlocked(input: {entryId: number}): void {
	console.log(`--> entry unlocked: ${input.entryId}`);
}

function onEntryInserted(entry: Entry): void {
	console.log(`--> entry inserted: ${JSON.stringify(entry,null,"\t")}`);
}

function onEntryUpdated(entry: Entry): void {
	console.log(`--> entry updated: ${JSON.stringify(entry,null,"\t")}`);
}

function onEntryDeleted(input: {entryId: number}): void {
	console.log(`--> entry deleted: ${input.entryId}`);
}


// @1: functions for LOGIN / LOGOUT
async function testLogin1() {
	console.log("-- testLogin1 ---------------");
	const {token} = await trpc.login.mutate({username: "3noix", password: "password"});
	console.log(`token = ${token}`);
	await sleep(1000);
	await trpc.logout.mutate({token});
}

async function testLogin2() {
	console.log("-- testLogin2 ---------------");
	await trpc.logout.mutate({token: "80ba2fbb-9412-4895-9052-1e379b1dbfd1"});
}


// @1: functions for LOCK / UNLOCK
async function testLockUnlock1() {
	console.log("-- testLockUnlock1 ---------------");
	const {token} = await trpc.login.mutate({username: "3noix", password: "password"});
	const res = await trpc.lock.mutate({token, entryId: 3});
	await sleep(1000);
	await trpc.unlock.mutate({token, entryId: 3});
	await trpc.logout.mutate({token});
}

async function testLockUnlock2() {
	console.log("-- testLockUnlock2 ---------------");
	const {token} = await trpc.login.mutate({username: "3noix", password: "password"});
	await trpc.unlock.mutate({token, entryId: 3});
	await trpc.logout.mutate({token});
}


// @1: functions for SELECT
async function testGetAllEntries() {
	console.log("-- testGetAllEntries ---------------");
	const entries = await trpc.getAllEntries.query();
	console.log(entries);
}

async function testGetEntryById() {
	console.log("-- testGetEntryById ---------------");
	const entry = await trpc.getEntryById.query({entryId: 3});
	console.log(entry);
}


// @1: function for INSERT
async function testInsertEntry() {
	console.log("-- testInsertEntry ---------------");
	const newEntry = await trpc.insertEntry.mutate({description: "new entry 1", number: 0});
	console.log(newEntry);
}


// @1: function for UPDATE
async function testUpdateEntry1() {
	console.log("-- testUpdateEntry1 ---------------");
	const entryBefore = await trpc.getEntryById.query({entryId: 5});
	console.log(entryBefore);

	const {token} = await trpc.login.mutate({username: "3noix", password: "password"});
	await trpc.lock.mutate({token, entryId: 5});

	const entryAfter = await trpc.updateEntry.mutate({token, id: 5, description: "updated description", number: 9999});
	console.log(entryAfter);

	await trpc.unlock.mutate({token, entryId: 5});
	await trpc.logout.mutate({token});
}

async function testUpdateEntry2() {
	console.log("-- testUpdateEntry2 ---------------");
	const entryBefore = await trpc.getEntryById.query({entryId: 5});
	console.log(entryBefore);

	const {token} = await trpc.login.mutate({username: "3noix", password: "password"});

	const entryAfter = await trpc.updateEntry.mutate({token, id: 5, description: "other description", number: 9999});
	console.log(entryAfter);

	await trpc.logout.mutate({token});
}


// @1: function for DELETE
async function testDeleteEntry1() {
	console.log("-- testDeleteEntry1 ---------------");
	const entriesBefore = await trpc.getAllEntries.query();
	const {token} = await trpc.login.mutate({username: "3noix", password: "password"});
	await trpc.lock.mutate({token, entryId: 5});
	await trpc.deleteEntry.mutate({token, entryId: 5});
	await trpc.logout.mutate({token});
	const entriesAfter = await trpc.getAllEntries.query();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}

async function testDeleteEntry2() {
	console.log("-- testDeleteEntry2 ---------------");
	const entriesBefore = await trpc.getAllEntries.query();
	const {token} = await trpc.login.mutate({username: "3noix", password: "password"});
	await trpc.deleteEntry.mutate({token, entryId: 5});
	await trpc.logout.mutate({token});
	const entriesAfter = await trpc.getAllEntries.query();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}
