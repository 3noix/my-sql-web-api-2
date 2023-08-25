import {trpc} from "./trpc";
import {z} from "zod";


export const lock = trpc.procedure
	.input(z.object({entryId: z.number()}))
	.output(z.boolean())
	.query(req => {
		const id = req.input;
		console.log(`Try to lock #${id}`);
		return true;
		// throw new Error(`Failed to lock ${id}`);
});


export const unlock = trpc.procedure
	.input(z.object({entryId: z.number()}))
	.output(z.boolean())
	.query(req => {
		const id = req.input;
		console.log(`Try to unlock #${id}`);
		return true;
		// throw new Error(`Failed to unlock ${id}`);
});
