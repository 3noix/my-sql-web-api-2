import {drizzle} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import {env} from "../environment";


const sqlite = new Database(env.database.sqliteFile);
export const db = drizzle(sqlite, {schema});
