import {entrySchema} from "./db/types";
import {z} from "zod";


// @1: ENVIRONMENT
export type Environment = {
	database: {
		sqliteFile: string;
	},
	trpc: {
		logProcCalls: boolean;
		logWsConnectionOpening: boolean;
		logWsConnectionClose: boolean;
		tokenExpirationTimeMs: number;
	}
};


// @1: ADD DATA TO DB TYPES
export const entryAndLockSchema = entrySchema.merge(z.object({lockedBy: z.string().or(z.null())}));
export type EntryAndLock = z.infer<typeof entryAndLockSchema>;
