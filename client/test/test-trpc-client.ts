import {createTRPCProxyClient, httpBatchLink} from "@trpc/client";
import type {Router} from "../../api/src/router";


const client = createTRPCProxyClient<Router>({
	links: [
		httpBatchLink({
			url: "http://localhost:3000"
		}),
	],
});


// @2: MAIN
async function main() {
	// await testGetAllEntries();
	await testGetEntryById();
	// await testUpdateEntry();
	// await testInsertEntry();
	// await testDeleteEntry();
}

main();


// @1: functions for CONNECT / DISCONNECT
// const {token} = await client.connect.query({name: "3noix"});
// await client.disconnect.query({token});


// @1: functions for LOCK / UNLOCK
// const resLock = await client.lock.query({entryId: 1, token});
// const resUnlock = await client.unlock.query({entryId: 3, token});


// @1: functions for SELECT
async function testGetAllEntries() {
	console.log("-- testGetAllEntries ---------------");
	const entries = await client.getAllEntries.query();
	console.log(entries);
}

async function testGetEntryById() {
	console.log("-- testGetEntryById ---------------");
	const entry = await client.getEntryById.query({entryId: 46});
	console.log(entry);
}


// // @1: function for UPDATE
async function testUpdateEntry() {
	console.log("-- testUpdateEntry ---------------");
	const entryBefore = await client.getEntryById.query({entryId: 45});
	console.log(entryBefore);
	const entryAfter = await client.updateEntry.mutate({id: 45, description: "new description 0", number: 9999, token: "token"});
	console.log(entryAfter);
}


// // @1: function for INSERT
async function testInsertEntry() {
	console.log("-- testInsertEntry ---------------");
	const newEntry = await client.insertEntry.mutate({description: "new entry 1", number: 0});
	console.log(newEntry);
}


// // @1: function for DELETE
async function testDeleteEntry() {
	console.log("-- testDeleteEntry ---------------");
	const entriesBefore = await client.getAllEntries.query();
	const result = await client.deleteEntry.mutate({entryId: 54, token: "token"});
	const entriesAfter = await client.getAllEntries.query();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}
