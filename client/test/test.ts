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
	client.lock.query({entryId: 1});
	client.unlock.query({entryId: 3});

	// const result = await client.greeting.query({ name: "Kyle" });
	// console.log(result);

	// await client.error.query().catch(e => console.error(e));

	// const users = await Promise.all([
	//	 client.users.byId.query("1"),
	//	 client.users.byId.query("2"),
	//	 client.users.byId.query("3"),
	//	 client.users.byId.query("4"),
	//	 client.users.byId.query("5"),
	//	 client.users.byId.query("6"),
	// ]);
	// console.log(users);

	// const newUser = await client.users.create.mutate({ name: "John", age: 12 });
	// console.log(newUser);

	// const newUserGot = await client.users.byId.query(newUser.id);
	// console.log(newUserGot);
}

main();

