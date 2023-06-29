import { VercelRequest, VercelResponse } from "@vercel/node";
import { renderPage } from "vite-plugin-ssr/server";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { url, headers } = request;
  const origin = headers.origin || request.headers.host || "";

  console.log("Request to url:", url);

  const pageContextInit: {
    urlOriginal: string;
    origin: string;
    referer: string;
    cookies: string;
    redirectTo?: string;
  } = {
    urlOriginal: headers.host || origin,
    origin: headers.referer || origin,
    referer: headers.referer || origin,
    cookies: JSON.stringify(request.cookies || "{}"),
  };

  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (pageContext.redirectTo) {
    return response.redirect(302, pageContext.redirectTo);
  } else if (!httpResponse) {
    response.statusCode = 200;
    response.end();
    return;
  } else {
    const { body, statusCode, contentType, earlyHints } = httpResponse;
    // if (response.writeEarlyHints) {
    //   response.writeEarlyHints({
    //     link: earlyHints.map((e) => e.earlyHintLink),
    //   });
    // }
    response
      .status(statusCode)
      .setHeader("Content-Type", contentType)
      .send(body);
  }

  const { body, statusCode, contentType } = httpResponse;
  response.statusCode = statusCode;
  response.setHeader("content-type", contentType);
  response.end(body);
}
