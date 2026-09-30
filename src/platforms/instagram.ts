import { env } from "../lib/env.js";
// Keep this adapter isolated: verify the current official Instagram Private Replies endpoint/permissions before production use.
export async function sendInstagramPrivateReply(commentId:string,message:string){ const e=env(); if(!e.INSTAGRAM_ACCESS_TOKEN) throw new Error("Instagram credentials missing");
 const r=await fetch(`https://graph.facebook.com/${e.META_GRAPH_VERSION}/${commentId}/private_replies`,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${e.INSTAGRAM_ACCESS_TOKEN}`},body:JSON.stringify({message}),signal:AbortSignal.timeout(10000)}); if(!r.ok) throw new Error(`Instagram API ${r.status}: ${(await r.text()).slice(0,500)}`); }
