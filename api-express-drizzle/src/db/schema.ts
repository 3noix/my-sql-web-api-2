import {sqliteTable, text, integer} from "drizzle-orm/sqlite-core";


export const entries = sqliteTable("entries", {
	id: integer("id").primaryKey().notNull(),
	description: text("description", { length: 100 }).notNull(),
	number: integer("number").notNull().default(0),
	lastModif: text("last_modif").notNull()
});
