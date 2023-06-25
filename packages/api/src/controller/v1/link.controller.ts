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
  get_link_by_slug,
  get_links,
} from "@lib/services";

export const route = ["/link"];
export const router = new KoaRouter();

export const LinkController = { router, route };

router.post(
  "/",
  SchemaResolver(linkCreateSchema),
  async (ctx: ParameterizedContext<SchemaContext<LinkCreateSchema>>) => {
    ctx.body = await create_link(ctx.state.body);
    ctx.status = 201;
  },
); // {post} /v1/link

router.get(
  "/:slug",
  PathResolver(slugSchema),
  async (ctx: ParameterizedContext<PathContext<SlugSchema>>) => {
    ctx.body = await get_link_by_slug(ctx.state.path.slug);
  },
); // {get} /v1/link/:slug

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.body = await get_links();
}); // {get} /v1/link
