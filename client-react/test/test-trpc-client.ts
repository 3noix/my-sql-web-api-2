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
	trpc.onInsert.subscribe(undefined, {onData: onInsert});
	trpc.onUpdate.subscribe(undefined, {onData: onUpdate});
	trpc.onDelete.subscribe(undefined, {onData: onDelete});

	// await testRegister1();
	// await testRegister2();
	// await testLockUnlock1();
	// await testLockUnlock2();
	await testGetAllEntries();
	// await testGetEntryById();
	// await testInsertEntry();
	// await testUpdateEntry1();
	// await testUpdateEntry2();
	// await testDeleteEntry1();
	// await testDeleteEntry2();
	await sleep(5000);
}

main();


// @2: CALLBACKS OF NOTIFICATIONS
function onInsert(entry: Entry): void {
	console.log(`--> entry inserted: ${entry}`);
}

function onUpdate(entry: Entry): void {
	console.log(`--> entry updated: ${entry}`);
}

function onDelete(input: {deletedEntryId: number}): void {
	console.log(`--> entry deleted: ${input.deletedEntryId}`);
}


// @1: functions for REGISTER / UNREGISTER
async function testRegister1() {
	console.log("-- testRegister1 ---------------");
	const {token} = await trpc.register.query({name: "3noix"});
	console.log(`token = ${token}`);
	await sleep(1000);
	await trpc.unregister.query({token});
}

async function testRegister2() {
	console.log("-- testUnregister2 ---------------");
	await trpc.unregister.query({token: "80ba2fbb-9412-4895-9052-1e379b1dbfd1"});
}


// @1: functions for LOCK / UNLOCK
async function testLockUnlock1() {
	console.log("-- testLockUnlock1 ---------------");
	const {token} = await trpc.register.query({name: "3noix"});
	const res = await trpc.lock.query({token, entryId: 43});
	await sleep(1000);
	await trpc.unlock.query({token, entryId: 43});
	await trpc.unregister.query({token});
}

async function testLockUnlock2() {
	console.log("-- testLockUnlock2 ---------------");
	const {token} = await trpc.register.query({name: "3noix"});
	await trpc.unlock.query({token, entryId: 43});
	await trpc.unregister.query({token});
}


// @1: functions for SELECT
async function testGetAllEntries() {
	console.log("-- testGetAllEntries ---------------");
	const entries = await trpc.getAllEntries.query();
	console.log(entries);
}

async function testGetEntryById() {
	console.log("-- testGetEntryById ---------------");
	const entry = await trpc.getEntryById.query({entryId: 46});
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
	const entryBefore = await trpc.getEntryById.query({entryId: 45});
	console.log(entryBefore);

	const {token} = await trpc.register.query({name: "3noix"});
	await trpc.lock.query({token, entryId: 45});

	const entryAfter = await trpc.updateEntry.mutate({token, id: 45, description: "new description 0", number: 9999});
	console.log(entryAfter);

	await trpc.unlock.query({token, entryId: 45});
	await trpc.unregister.query({token});
}

async function testUpdateEntry2() {
	console.log("-- testUpdateEntry2 ---------------");
	const entryBefore = await trpc.getEntryById.query({entryId: 45});
	console.log(entryBefore);

	const {token} = await trpc.register.query({name: "3noix"});

	const entryAfter = await trpc.updateEntry.mutate({token, id: 45, description: "new description 0", number: 9999});
	console.log(entryAfter);

	await trpc.unregister.query({token});
}


// @1: function for DELETE
async function testDeleteEntry1() {
	console.log("-- testDeleteEntry1 ---------------");
	const entriesBefore = await trpc.getAllEntries.query();
	const {token} = await trpc.register.query({name: "3noix"});
	await trpc.lock.query({token, entryId: 59});
	await trpc.deleteEntry.mutate({token, entryId: 59});
	await trpc.unregister.query({token});
	const entriesAfter = await trpc.getAllEntries.query();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}

async function testDeleteEntry2() {
	console.log("-- testDeleteEntry2 ---------------");
	const entriesBefore = await trpc.getAllEntries.query();
	const {token} = await trpc.register.query({name: "3noix"});
	await trpc.deleteEntry.mutate({token, entryId: 59});
	await trpc.unregister.query({token});
	const entriesAfter = await trpc.getAllEntries.query();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}
