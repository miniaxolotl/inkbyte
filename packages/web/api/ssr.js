import { renderPage } from "vite-plugin-ssr/server";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @param {NextApiResponse} request
 * @param {NextApiResponse} response
 * @returns
 */
export default async function handler(request, response) {
  const { url, originalUrl } = request;
  const hostname = request.hostname || originalUrl || request.headers.host;
  console.log("Request to url:", url);

  const pageContextInit = {
    urlOriginal,
    origin: hostname || "",
    referer: hostname || "",
    cookies: request.cookies,
  };

  if (!request.cookies.session_id) {
    const session_id = `${new Date().getTime()}-${uuid()}`;
    request.cookies.session_id = session_id;
    response.cookie("session_id", session_id, {
      path: "/",
      expires: addDays(new Date(), 30),
    });
  }

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
    if (response.writeEarlyHints) {
      response.writeEarlyHints({
        link: earlyHints.map((e) => e.earlyHintLink),
      });
    }
    response.status(statusCode).type(contentType).send(body);
  }

  const { body, statusCode, contentType } = httpResponse;
  response.statusCode = statusCode;
  response.setHeader("content-type", contentType);
  response.end(body);
}
