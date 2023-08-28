// @1: ENVIRONMENT
export type Environment = {
	database: {
		host: string;
		port: number;
		user: string;
		password: string;
		database: string;
	},
	trpc: {
		logProcCalls: boolean;
		logWsConnectionOpening: boolean;
		logWsConnectionClose: boolean;
		tokenExpirationTimeMs: number;
	}
};
