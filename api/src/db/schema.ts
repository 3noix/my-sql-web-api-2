import {mysqlTable, varchar, mediumint, int, datetime} from "drizzle-orm/mysql-core";


export const entries = mysqlTable("entries", {
	id: mediumint("id").autoincrement().primaryKey().notNull(),
	description: varchar("description", { length: 100 }).notNull(),
	number: int("number").notNull().default(0),
	lastModif: datetime("last_modif", { mode: "string" }).notNull()
});
