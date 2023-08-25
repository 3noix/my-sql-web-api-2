import {createTRPCProxyClient, httpBatchLink} from "@trpc/client";
import type {Router} from "../../api/src/router";


const client = createTRPCProxyClient<Router>({
	links: [
		httpBatchLink({
			url: "http://localhost:3000"
		}),
	],
});


async function main() {
	const {token} = await client.connect.query({name: "3noix"});
	await client.disconnect.query({token});
	const resLock = await client.lock.query({entryId: 1, token});
	const resUnlock = await client.unlock.query({entryId: 3, token});
	const allEntries = await client.getAllEntries.query();
	const entry46 = await client.getEntryById.query({entryId: 46});
	const res1 = await client.insertEntry.mutate(1);
	const res2 = await client.updateEntry.mutate(1);
	const res3 = await client.deleteEntry.mutate(1);

	// const result = await client.greeting.query({ name: "Kyle" });
	// await client.error.query().catch(e => console.error(e));

	// const users = await Promise.all([
	//	 client.users.byId.query("1"),
	//	 client.users.byId.query("2"),
	//	 client.users.byId.query("3"),
	//	 client.users.byId.query("4"),
	//	 client.users.byId.query("5"),
	//	 client.users.byId.query("6"),
	// ]);

	// const newUser = await client.users.create.mutate({ name: "John", age: 12 });
	// const newUserGot = await client.users.byId.query(newUser.id);
}

main();

