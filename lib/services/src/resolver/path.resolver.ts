import { Next, ParameterizedContext } from "koa";
import { IMiddleware } from "koa-router";
import Joi from "joi";

import { CLIENT_ERROR } from "@lib/utility";
import { validateSchema } from "@lib/schema-validator";

export type PathContext<T = { [key: string]: unknown }> = {
  path: T;
};

export const PathResolver = <T = unknown>(
  Schema: Joi.ObjectSchema,
): IMiddleware<PathContext<T>> => {
  return async (ctx: ParameterizedContext<PathContext<T>>, next: Next) => {
    const { value, error } = validateSchema<T>(Schema, ctx.params, {
      allowUnknown: false,
      abortEarly: false,
      errors: { escapeHtml: true },
    });
    if (error || !value) {
      ctx.status = CLIENT_ERROR.BAD_REQUEST.status;
      ctx.body = error?.[0] || "Invalid request body";
      return;
    }
    ctx.state = {
      ...ctx.state,
      path: value,
    };
    await next();
  };
};
