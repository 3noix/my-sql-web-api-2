import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {AuthenticationProvider} from "./useAuthentication";

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {splitLink, httpBatchLink, wsLink, createWSClient} from '@trpc/client';
import {trpc} from './trpc';


const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Infinity,
			cacheTime: 0,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false
		},
		mutations: {
			cacheTime: 0
		}
	}
});

let iConnection = 0;
const trpcClient = trpc.createClient({
	links: [
		splitLink({
			condition: op => {
				return op.type === "subscription";
			},
			true: wsLink({
				client: createWSClient({
					url: "ws://localhost:3000",
					onOpen:  async () => {
						iConnection++;
						console.log(`WS connection is open (${iConnection})`);
						// await queryClient.invalidateQueries(["getAllEntries"]); // PB: does nothing
						// await queryClient.invalidateQueries(["getAllEntries"], {refetchType: "all"}); // PB: does nothing
						// await queryClient.invalidateQueries(); // works (both getAllEntries and register)
						// await queryClient.refetchQueries(["getAllEntries", undefined]); // PB: does nothing
						// await queryClient.refetchQueries(); // works (both getAllEntries and register)

						// const res = queryClient.getQueriesData({type: "all"}); // returns the 2 queries
						// const res = queryClient.getQueriesData(["getAllEntries"]); // PB: return empty array
						// const res = queryClient.getQueriesData(["getAllEntries", undefined]); // PB: return empty array
						// console.log(res);
					},
					onClose: () => {
						console.log(`WS connnection is closed (${iConnection})`);
					}
				})
			}),
			false: httpBatchLink({
				url: "http://localhost:3000"
			})
		})
	]
});


ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<AuthenticationProvider>
					<App/>
				</AuthenticationProvider>
				<ReactQueryDevtools initialIsOpen={false}/>
			</QueryClientProvider>
		</trpc.Provider>
	</React.StrictMode>
);
