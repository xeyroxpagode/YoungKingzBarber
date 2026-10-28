import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient(){const store=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL??"http://127.0.0.1:55321",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"local-anon-key-required",{cookies:{getAll(){return store.getAll();},setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options));}catch{}}}});}
