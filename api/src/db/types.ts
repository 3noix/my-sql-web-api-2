import {entries} from "./schema";
import {PreparedQuery} from "drizzle-orm/mysql-core";
import {MySql2PreparedQuery} from "drizzle-orm/mysql2";


// @1: utility types
export type ReturnTypeOfPreparedQuery<PreparedQueryType> = PreparedQueryType extends PreparedQuery<infer T> ? T["execute"] : never;
export type ReturnTypeOfRelationPreparedQuery<PreparedQueryType> = PreparedQueryType extends MySql2PreparedQuery<infer T> ? T["execute"] : never;


// @1: types infered from the SQL table
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

