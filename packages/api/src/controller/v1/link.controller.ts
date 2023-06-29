import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import {
  HeaderContext,
  HeaderResolver,
  PathContext,
  PathResolver,
  SchemaContext,
  SchemaResolver,
  SessionContext,
  SessionGuard,
  create_link,
  get_domain_by_slug,
  get_link_by_slug,
  get_links,
} from "@lib/services";
import {
  LinkCreateSchema,
  LinkRequestSchema,
  SlugSchema,
  linkCreateSchema,
  linkRequestSchema,
  slugSchema,
} from "@lib/schema-validator";
import { CLIENT_ERROR } from "@lib/utility";

export const route = ["/link"];
export const router = new KoaRouter();

export const LinkController = { router, route };

router.post(
  "/",
  SchemaResolver(linkCreateSchema),
  SessionGuard({ passthrough: true }),
  async (
    ctx: ParameterizedContext<
      SchemaContext<LinkCreateSchema> & Partial<SessionContext>
    >,
  ) => {
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
        ctx.throw(
          CLIENT_ERROR.CONFLICT.status,
          "A link already exists for the specified alias!",
        );
      }
    }

    ctx.body = await create_link(
      ctx.state.body,
      ctx.state.session?.user_id ?? null,
    );
    ctx.status = 201;
  },
); // {post} /v1/link

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.body = await get_links();
}); // {get} /v1/link

router.get(
  "/:slug",
  PathResolver(slugSchema),
  HeaderResolver(linkRequestSchema),
  async (
    ctx: ParameterizedContext<
      PathContext<SlugSchema> & HeaderContext<LinkRequestSchema>
    >,
  ) => {
    const origin = (ctx.state.headers["client-origin"] ?? ctx.origin).replace(
      /^((http|https)(:\/\/))?(www\.)?(api\.)?/,
      "",
    );
    const domain = await get_domain_by_slug(origin);

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

    ctx.body = link;
  },
); // {get} /v1/link/:slug
