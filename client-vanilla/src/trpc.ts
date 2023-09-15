import {createTRPCProxyClient, createWSClient, splitLink, httpBatchLink, wsLink} from "@trpc/client";
import type {Router} from "../../api-express-drizzle/src/router";
import {setButtonsEnabled} from "./html-manipulation";
import * as html from "./html-manipulation";


let iConnection = 0;
export const trpc = createTRPCProxyClient<Router>({
	links: [
		splitLink({
			condition: op => {
				return op.type === "subscription";
			},
			true: wsLink({
				client: createWSClient({
					url: "ws://localhost:3000",
					onOpen: async () => {
						iConnection++;
						console.log(`WS connection is open (${iConnection})`);
						setButtonsEnabled(true);
						if (iConnection > 1) {
							// refetch all the entries and update the GUI
							const entries = await trpc.getAllEntries.query();
							html.clearAllEntries();
							for (const e of entries) {html.appendEntryInHtml(e);}
							// but does not get another token
						}
					},
					onClose: () => {
						console.log(`WS connection is closed (${iConnection})`);
						setButtonsEnabled(false);
					}
				})
			}),
			false: httpBatchLink({
				url: "http://localhost:3000"
			})
		})
	]
});
