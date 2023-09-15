import {entries} from "./schema";
import {createSelectSchema} from "drizzle-zod";


// @1: types infered from the SQL table
export type Entry = typeof entries.$inferSelect;


// @1: zod schemas
export const entrySchema = createSelectSchema(entries);
