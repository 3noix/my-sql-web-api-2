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

const trpcClient = trpc.createClient({
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
