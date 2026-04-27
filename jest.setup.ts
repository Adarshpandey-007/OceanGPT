import '@testing-library/jest-dom';

// Only polyfill if missing
if (typeof global.fetch === 'undefined') {
	const { Response, Request, Headers, fetch } = require('cross-fetch');
	// @ts-ignore
	global.fetch = fetch;
	// @ts-ignore
	global.Response = Response;
	// @ts-ignore
	global.Request = Request;
	// @ts-ignore
	global.Headers = Headers;
}

// Polyfill Response.json static helper expected by NextResponse.json internals
// (Node 18+ Response has instance json(), but Next uses Response.json static)
if (typeof (global as any).Response !== 'undefined' && typeof (global as any).Response.json !== 'function') {
	(global as any).Response.json = function json(body: any, init?: ResponseInit) {
		return new (global as any).Response(JSON.stringify(body), {
			headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
			...init
		});
	};
}
