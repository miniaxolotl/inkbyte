import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import {
  LinkCreateSchema,
  SlugSchema,
  linkCreateSchema,
  slugSchema,
} from "@lib/schema-validator";
import {
  PathContext,
  PathResolver,
  SchemaContext,
  SchemaResolver,
  create_link,
  get_domain_by_slug,
  get_link_by_slug,
  get_links,
} from "@lib/services";
import { CLIENT_ERROR } from "@lib/utility";

export const route = ["/link"];
export const router = new KoaRouter();

export const LinkController = { router, route };

router.post(
  "/",
  SchemaResolver(linkCreateSchema),
  async (ctx: ParameterizedContext<SchemaContext<LinkCreateSchema>>) => {
    const request = ctx.state.body;

    const domain = await get_domain_by_slug(request.domain);
    if (!domain) {
      ctx.throw(
        CLIENT_ERROR.BAD_REQUEST.status,
        CLIENT_ERROR.BAD_REQUEST.message,
      );
    }

    if (request.custom_slug) {
      const existing_link = await get_link_by_slug({
        slug: request.custom_slug,
        domain_id: domain?.id,
      });
      if (existing_link) {
        ctx.throw(CLIENT_ERROR.CONFLICT.status, CLIENT_ERROR.CONFLICT.message);
      }
    }

    ctx.body = await create_link(ctx.state.body);
    ctx.status = 201;
  },
); // {post} /v1/link

router.get(
  "/:slug",
  PathResolver(slugSchema),
  async (ctx: ParameterizedContext<PathContext<SlugSchema>>) => {
    const origin = ctx.origin.replace(/^((http|https)(:\/\/))?(www\.)?/, "");
    const domain = await get_domain_by_slug(origin);
    if (!domain) {
      ctx.throw(
        CLIENT_ERROR.BAD_REQUEST.status,
        CLIENT_ERROR.BAD_REQUEST.message,
      );
    }

    ctx.body = await get_link_by_slug({
      slug: ctx.state.path.slug,
      domain_id: domain.id,
    });
  },
); // {get} /v1/link/:slug

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.body = await get_links();
}); // {get} /v1/link
