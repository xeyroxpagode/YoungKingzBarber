import { sql, type SQL } from "drizzle-orm";
import { database } from "./runtime.js";

export async function rows<T>(query: SQL): Promise<T[]> {
  const result = await database.db.execute(query);
  return Array.from(result as unknown as Iterable<T>);
}
export async function one<T>(query: SQL): Promise<T | undefined> { return (await rows<T>(query))[0]; }
export { sql };
