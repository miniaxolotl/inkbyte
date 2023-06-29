import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import { CLIENT_ERROR, uuid } from "@lib/utility";
import {
  HeaderContext,
  HeaderResolver,
  PathContext,
  PathResolver,
  create_link_log,
  get_domain_by_slug,
  get_link_by_slug,
  get_links,
} from "@lib/services";
import {
  SessionIdSchema,
  SlugSchema,
  sessionIdSchema,
  slugSchema,
} from "@lib/schema-validator";

export const route = ["/r"];
export const router = new KoaRouter();

export const LinkController = { router, route };

router.get(
  "/:slug",
  PathResolver(slugSchema),
  HeaderResolver(sessionIdSchema.partial()),
  async (
    ctx: ParameterizedContext<
      PathContext<SlugSchema> & HeaderContext<SessionIdSchema>
    >,
  ) => {
    const origin = (ctx.URL.hostname ?? ctx.origin).replace(
      /^((http|https)(:\/\/))?(www\.)?(api\.)?/,
      "",
    );
    const domain = await get_domain_by_slug(origin);

    console.log(domain);
    console.log(origin);
    console.log(ctx.origin);
    console.log(ctx.URL);

    if (!domain) {
      ctx.throw(
        CLIENT_ERROR.BAD_REQUEST.status,
        CLIENT_ERROR.BAD_REQUEST.message,
      );
    }

    const link = await get_link_by_slug({
      slug: ctx.state.path.slug,
      domain_id: domain.id,
    });
    if (!link) {
      ctx.throw(CLIENT_ERROR.NOT_FOUND.status, CLIENT_ERROR.NOT_FOUND.message);
    }

    await create_link_log({
      link_id: link.id,
      session_id:
        ctx.state.headers["session-id"] ?? `${new Date().getTime()}-${uuid()}`,
      ip_address: ctx.ip,
      user_agent: ctx.headers["user-agent"],
      referrer: ctx.headers.referer,
    });

    ctx.body = link;
  },
); // {post} /v1/r/:slug

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.body = await get_links();
}); // {get} /v1/r
