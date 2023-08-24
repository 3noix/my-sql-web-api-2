import {drizzle} from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import {env} from "../environment";


const poolConnection = mysql.createPool({
	host: env.database.host,
	port: env.database.port,
	user: env.database.user,
	password: env.database.password,
	database: env.database.database
});

export const db = drizzle(poolConnection, {schema, mode: "default"});

export async function disconnectFromDb() {
	poolConnection.end();
}

