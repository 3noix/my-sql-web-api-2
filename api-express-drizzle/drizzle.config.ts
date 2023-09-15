import {Config} from "drizzle-kit";

export default {
	out: "./migrations",
	schema: "./src/db/schema.ts",
	breakpoints: false,
	driver: "better-sqlite",
	dbCredentials: {
		// url: `file://${__dirname.replace(/\\/g,"/")}/entries.db`
		url: ""
	}
} satisfies Config;
