import {entries} from "./schema";
import {PreparedQuery} from "drizzle-orm/mysql-core";
import {MySql2PreparedQuery} from "drizzle-orm/mysql2";
import {createSelectSchema} from "drizzle-zod";


// @1: utility types
export type ReturnTypeOfPreparedQuery<PreparedQueryType> = PreparedQueryType extends PreparedQuery<infer T> ? T["execute"] : never;
export type ReturnTypeOfRelationPreparedQuery<PreparedQueryType> = PreparedQueryType extends MySql2PreparedQuery<infer T> ? T["execute"] : never;


// @1: types infered from the SQL table
export type Entry = typeof entries.$inferSelect;


// @1: zod schemas
export const entrySchema = createSelectSchema(entries);
