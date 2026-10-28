import { buildApp } from "./app.js";
import { runtime } from "./lib/runtime.js";

const app = await buildApp();
await app.listen({ host: runtime.host, port: runtime.port });
