import {createTRPCProxyClient, createWSClient, splitLink, httpBatchLink, wsLink} from "@trpc/client";
import type {Router} from "../../api-express-drizzle/src/router";
import {setButtonsEnabled} from "./html-manipulation";

export const trpc = createTRPCProxyClient<Router>({
	links: [
		splitLink({
			condition: op => {
				return op.type === "subscription";
			},
			true: wsLink({
				client: createWSClient({
					url: "ws://localhost:3000",
					onOpen: () => {
						console.log("connected!");
						setButtonsEnabled(true);
					},
					onClose: () => {
						console.log("disconnected!");
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
