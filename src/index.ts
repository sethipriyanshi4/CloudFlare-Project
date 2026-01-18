import type { WorkflowParams } from './workflow';
export { FeedbackIngestWorkflow } from './workflow';

export interface Env {
	DB: D1Database;
	FEEDBACK_WORKFLOW: Workflow<WorkflowParams>;
}
  
type IngestPayload = {
	source: string;
	raw_text: string;
	author?: string;
	url?: string;
};
  
  export default {
	async fetch(request: Request, env: Env): Promise<Response> {
	  const url = new URL(request.url);
  
	  // Simple UI so you can see "something" without building a frontend yet
	  if (request.method === "GET" && url.pathname === "/") {
		return new Response(
		  `Hello World!\nTry POST /ingest with JSON: { "source":"slack", "raw_text":"..." }`,
		  { headers: { "content-type": "text/plain" } }
		);
	  }
  
	  if (request.method === "POST" && url.pathname === "/ingest") {
		let body: IngestPayload;
		try {
		  body = (await request.json()) as IngestPayload;
		} catch {
		  return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
		}
  
		if (!body?.source || body.source.trim().length === 0) {
		  return Response.json({ ok: false, error: "`source` is required" }, { status: 400 });
		}

		if (!body?.raw_text || body.raw_text.trim().length === 0) {
		  return Response.json({ ok: false, error: "`raw_text` is required" }, { status: 400 });
		}

		// Start workflow with payload
		try {
		  const instance = await env.FEEDBACK_WORKFLOW.create({
			params: {
			  source: body.source.trim(),
			  raw_text: body.raw_text.trim(),
			  author: body.author,
			  url: body.url,
			},
		  });

		  return Response.json({
			ok: true,
			workflow_id: instance.id,
			message: "Feedback ingestion workflow started",
		  });
		} catch (e: any) {
		  return Response.json(
			{ ok: false, error: "Failed to start workflow", detail: String(e) },
			{ status: 500 }
		  );
		}
	  }
  
	  return new Response("Not found", { status: 404 });
	},
  };
  
