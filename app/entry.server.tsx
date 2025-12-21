import type { EntryContext } from "@remix-run/node";
import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import isbot from "isbot";

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  context: EntryContext
) {
  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={context} url={request.url} />,
      {
        [callbackName]() {
          const body = new PassThrough();
          const responseHeaders = new Headers(headers);
          responseHeaders.set("Content-Type", "text/html");

          pipe(body);
          resolve(
            new Response(body, {
              status: didError ? 500 : statusCode,
              headers: responseHeaders
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        }
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
