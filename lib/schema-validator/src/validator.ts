import yup, { ObjectSchema, ValidateOptions, ValidationError } from "yup";

export const validateSchema = <T = unknown>(
  schema: ObjectSchema<yup.AnyObject>,
  data: Record<string, unknown>,
  options: ValidateOptions = {},
) => {
  let value: { [x: string]: unknown; [x: number]: unknown } | null = null;
  try {
    value = schema.validateSync(data, {
      abortEarly: false,
      ...options,
    });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      console.log(error);
      return {
        value: null,
        error: error.inner.map((e) => ({
          path: e.path ?? "",
          message: e.message.replace(/"/g, ""),
        })),
      } as { value: null; error: { path: string; message: string }[] };
    }
  }

  return {
    value,
    error: null,
  } as { value: T; error: null };
};
