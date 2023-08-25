import {mysqlTable, varchar, mediumint, int, timestamp} from "drizzle-orm/mysql-core";


export const entries = mysqlTable("entries", {
	id: mediumint("id").autoincrement().primaryKey().notNull(),
	description: varchar("description", { length: 100 }).notNull(),
	number: int("number").notNull().default(0),
	lastModif: timestamp("last_modif").notNull().defaultNow()
});
