import * as q from "../src/db/queries";
import {disconnectFromDb} from "../src/db/db";


// @2: MAIN
async function main() {
	await testGetAllEntries();
	// await testGetEntryById();
	// await testUpdateEntry();
	// await testUpdateEntryAndReturns();
	// await testInsertEntry();
	// await testInsertEntryAndReturns();
	// await testDeleteEntry();
	await disconnectFromDb();
}

main();


// @1: functions for SELECT
async function testGetAllEntries() {
	console.log("-- testGetAllEntries ---------------");
	const entries = await q.getAllEntries();
	console.log(entries);
}

async function testGetEntryById() {
	console.log("-- testGetEntryById ---------------");
	const entry = await q.getEntryById(46);
	console.log(entry);
}


// @1: functions for UPDATE
async function testUpdateEntry() {
	console.log("-- testUpdateEntry ---------------");
	const entryBefore = await q.getEntryById(45);
	console.log(entryBefore);
	await q.updateEntry({id: 45, description: "new description 1", number: 9999});
	const entryAfter = await q.getEntryById(45);
	console.log(entryAfter);
}

async function testUpdateEntryAndReturns() {
	console.log("-- testUpdateEntryAndReturns ---------------");
	const entryBefore = await q.getEntryById(45);
	console.log(entryBefore);
	const entryAfter = await q.updateEntryAndReturns({id: 45, description: "new description 2", number: 9999});
	console.log(entryAfter);
}


// @1: functions for INSERT
async function testInsertEntry() {
	console.log("-- testInsertEntry ---------------");
	const aze = await q.insertEntry({description: "new entry 1"});
	const entries = await q.getAllEntries();
	console.log(entries);
}

async function testInsertEntryAndReturns() {
	console.log("-- testInsertEntryAndReturns ---------------");
	const newEntry = await q.insertEntryAndReturns({description: "new entry 2"});
	console.log(newEntry);
}


// @1: function for DELETE
async function testDeleteEntry() {
	console.log("-- testDeleteEntry ---------------");
	const entriesBefore = await q.getAllEntries();
	await q.deleteEntry(54);
	const entriesAfter = await q.getAllEntries();
	console.log(`Before: ${entriesBefore.map(e=>e.id.toString()).join(",")}`);
	console.log(`After:  ${entriesAfter.map(e=>e.id.toString()).join(",")}`);
}
