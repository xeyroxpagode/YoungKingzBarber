import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root=resolve(import.meta.dirname,"..");const output=resolve(root,"docs/h01/evidence/runtime");mkdirSync(output,{recursive:true});
function run(command:string,args:string[]){return execFileSync(command,args,{cwd:root,encoding:"utf8"}).trim();}
function runShell(command:string){return execSync(command,{cwd:root,encoding:"utf8",shell:true}).trim();}
const evidence={generatedAt:new Date().toISOString(),branch:run("git",["branch","--show-current"]),commit:run("git",["rev-parse","HEAD"]),status:run("git",["status","--short"]),node:run("node",["--version"]),pnpm:runShell("pnpm --version"),supabase:runShell("supabase --version")};
writeFileSync(resolve(output,"environment.json"),JSON.stringify(evidence,null,2)+"\n","utf8");console.log(`Evidence written to ${output}`);
