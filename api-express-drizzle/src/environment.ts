import {Environment} from "./types";


export const env: Environment = {
	database: {
		sqliteFile: "./src/db/entries.db"
	},
	trpc: {
		logProcCalls: true,
		logWsConnectionOpening: true,
		logWsConnectionClose: true,
		tokenExpirationTimeMs: 2 * 60 * 60 * 1000
	}
};
