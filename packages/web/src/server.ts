import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

dotenv.config({
  path: "../.env.local",
});

import { dirname } from "path";
import { fileURLToPath } from "url";

import { addDays } from "date-fns";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import { renderPage } from "vite-plugin-ssr/server";

import { uuid } from "@lib/utility";

const isProduction = process.env.NODE_ENV === "production";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = `${__dirname}/..`;

const startClient = async () => {
  const app = express();

  app.use(compression());
  app.use(cookieParser());

  if (isProduction) {
    const sirv = (await import("sirv")).default;
    app.use(sirv(`${root}/dist/client`));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vite = await import("vite");
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true },
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  app.get("*", async (req, res, next) => {
    const pageContextInit: {
      urlOriginal: string;
      origin: string;
      cookies: string;
      referer?: string;
      redirectTo?: string;
    } = {
      urlOriginal: req.originalUrl,
      origin: res.get("host") || res.get("origin") || req.headers.host || "",
      cookies: req.cookies,
      referer:
        req.headers.referer ||
        res.get("host") ||
        res.get("origin") ||
        req.headers.host ||
        "",
    };

    if (!req.cookies.session_id) {
      const session_id = `${new Date().getTime()}-${uuid()}`;
      req.cookies.session_id = session_id;
      res.cookie("session_id", session_id, {
        path: "/",
        expires: addDays(new Date(), 30),
      });
    }

    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;

    if (pageContext.redirectTo) {
      return res.redirect(302, pageContext.redirectTo);
    } else if (!httpResponse) {
      return next();
    } else {
      const { body, statusCode, contentType, earlyHints } = httpResponse;
      if (res.writeEarlyHints) {
        res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) });
      }
      res.status(statusCode).type(contentType).send(body);
    }
  });

  const port = process.env.WEB_PORT || 3020;
  app.listen(port);

  console.log(`Server running at http://localhost:${port}`);
};

startClient();
