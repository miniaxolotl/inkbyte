import type { ObjectSchema, ValidateOptions } from "yup";
import yup, { ValidationError } from "yup";

export const validateForm = (
  schema: ObjectSchema<yup.AnyObject>,
  data: Record<string, unknown>,
  options: ValidateOptions = {},
) => {
  let values: { [x: string]: string; [x: number]: string } = {};
  try {
    values = schema.validateSync(data, {
      abortEarly: false,
      ...options,
    });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return {
        values: null,
        errors: error.inner.reduce(
          (a, e) => ({ ...a, [e.path ?? ""]: e.message }),
          {} as { [x: string]: string },
        ),
      };
    }
  }
  return {
    values,
    errors: null,
  };
};
