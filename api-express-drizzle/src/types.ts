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
