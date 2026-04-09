import type { Connect } from 'vite';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest, type ApiResponsePayload } from './api';

export function createApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const pathname = getPathname(req.url);
    if (!pathname.startsWith('/api/')) {
      next();
      return;
    }

    try {
      const request = await toWebRequest(req);
      const result = await handleApiRequest(request);
      if (!result) {
        next();
        return;
      }

      sendResponse(res, result);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unexpected middleware error.';
      sendResponse(res, {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: { error: detail }
      });
    }
  };
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const method = req.method ?? 'GET';
  const targetUrl = resolveUrl(req);
  const headers = toHeaders(req.headers);
  const body = shouldReadBody(method) ? await readBody(req) : null;

  return new Request(targetUrl, {
    method,
    headers,
    body: body ? new Blob([toArrayBuffer(body)]) : undefined
  });
}

function resolveUrl(req: IncomingMessage): URL {
  const host = req.headers.host ?? 'localhost:5173';
  const urlPath = req.url ?? '/';
  return new URL(urlPath, `http://${host}`);
}

function toHeaders(source: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      headers.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    }
  }

  return headers;
}

function shouldReadBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve());
    req.on('error', reject);
  });

  return Buffer.concat(chunks);
}

function toArrayBuffer(value: Buffer): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

function sendResponse(res: ServerResponse, response: ApiResponsePayload): void {
  res.statusCode = response.status;
  if (response.headers) {
    for (const [name, value] of Object.entries(response.headers)) {
      res.setHeader(name, value);
    }
  }

  if (response.body === undefined) {
    res.end();
    return;
  }

  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }

  res.end(JSON.stringify(response.body));
}

function getPathname(urlValue: string | undefined): string {
  if (!urlValue) {
    return '/';
  }

  try {
    return new URL(urlValue, 'http://localhost').pathname;
  } catch {
    return '/';
  }
}
