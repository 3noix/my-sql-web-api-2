import {createTRPCProxyClient, httpBatchLink} from "@trpc/client";
import type {Router} from "../../api/src/router";


const client = createTRPCProxyClient<Router>({
	links: [
		httpBatchLink({
			url: "http://localhost:3000"
		}),
	],
});

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}


// @2: MAIN
async function main() {
	// await testConnect();
	// await testDisconnect1();
	// await testDisconnect2();
	// await testLockUnlock1();
	// await testLockUnlock2();
	// await testGetAllEntries();
	// await testGetEntryById();
	// await testInsertEntry();
	// await testUpdateEntry1();
	// await testUpdateEntry2();
	await testDeleteEntry1();
	// await testDeleteEntry2();
}

main();


// @1: functions for CONNECT / DISCONNECT
async function testConnect() {
	console.log("-- testConnect ---------------");
	const {token} = await client.connect.query({name: "3noix"});
	console.log(`token = ${token}`);
}

async function testDisconnect1() {
	console.log("-- testDisconnect1 ---------------");
	await client.disconnect.query({token: "80ba2fbb-9412-4895-9052-1e379b1dbfd1"});
}

async function testDisconnect2() {
	console.log("-- testDisconnect2 ---------------");
	const {token} = await client.connect.query({name: "3noix"});
	await sleep(1000);
	await client.disconnect.query({token});
}


// @1: functions for LOCK / UNLOCK
async function testLockUnlock1() {
	console.log("-- testLockUnlock1 ---------------");
	const {token} = await client.connect.query({name: "3noix"});
	const res = await client.lock.query({token, entryId: 43});
	await sleep(1000);
	await client.unlock.query({token, entryId: 43});
	await client.disconnect.query({token});
}

async function testLockUnlock2() {
	console.log("-- testLockUnlock2 ---------------");
	const {token} = await client.connect.query({name: "3noix"});
	await client.unlock.query({token, entryId: 43});
	await client.disconnect.query({token});
}


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


// @1: function for INSERT
async function testInsertEntry() {
	console.log("-- testInsertEntry ---------------");
	const newEntry = await client.insertEntry.mutate({description: "new entry 1", number: 0});
	console.log(newEntry);
}


// @1: function for UPDATE
async function testUpdateEntry1() {
	console.log("-- testUpdateEntry1 ---------------");
	const entryBefore = await client.getEntryById.query({entryId: 45});
	console.log(entryBefore);

	const {token} = await client.connect.query({name: "3noix"});
	await client.lock.query({token, entryId: 45});

	const entryAfter = await client.updateEntry.mutate({token, id: 45, description: "new description 0", number: 9999});
	console.log(entryAfter);

	await client.unlock.query({token, entryId: 45});
	await client.disconnect.query({token});
}

async function testUpdateEntry2() {
	console.log("-- testUpdateEntry2 ---------------");
	const entryBefore = await client.getEntryById.query({entryId: 45});
	console.log(entryBefore);

	const {token} = await client.connect.query({name: "3noix"});

	const entryAfter = await client.updateEntry.mutate({token, id: 45, description: "new description 0", number: 9999});
	console.log(entryAfter);

	await client.disconnect.query({token});
}


// @1: function for DELETE
async function testDeleteEntry1() {
	console.log("-- testDeleteEntry1 ---------------");
	const entriesBefore = await client.getAllEntries.query();
	const {token} = await client.connect.query({name: "3noix"});
	await client.lock.query({token, entryId: 59});
	await client.deleteEntry.mutate({token, entryId: 59});
	const entriesAfter = await client.getAllEntries.query();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}

async function testDeleteEntry2() {
	console.log("-- testDeleteEntry2 ---------------");
	const entriesBefore = await client.getAllEntries.query();
	const {token} = await client.connect.query({name: "3noix"});
	await client.deleteEntry.mutate({token, entryId: 59});
	const entriesAfter = await client.getAllEntries.query();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}
