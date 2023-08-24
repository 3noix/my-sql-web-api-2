import {trpc} from "./trpc";
import {lock, unlock} from "./procedures";


export const router = trpc.router({
	lock,
	unlock
});


export type Router = typeof router;

