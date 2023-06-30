import { VercelRequest, VercelResponse } from "@vercel/node";
import { renderPage } from "vite-plugin-ssr/server";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { url, headers } = request;
  const origin = request.headers.host || headers.origin || "";
  const referer = headers.referer || origin;

  console.log(request.url);
  console.log(headers);
  console.log("Request to url:", url);

  const pageContextInit: {
    urlOriginal: string;
    origin: string;
    referer: string;
    cookies: string;
    redirectTo?: string;
    userAgent?: string;
  } = {
    urlOriginal: request.url || origin,
    origin: origin,
    referer: origin || referer,
    cookies: JSON.stringify(request.cookies || "{}"),
    userAgent: request.headers["user-agent"],
  };

  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (pageContext.redirectTo) {
    return response.redirect(302, pageContext.redirectTo);
  } else if (!httpResponse) {
    response.statusCode = 200;
    return response.end();
  } else {
    const { body, statusCode, contentType } = httpResponse;
    response.statusCode = statusCode;
    response.setHeader("content-type", contentType);
    response.end(body);
  }
}
