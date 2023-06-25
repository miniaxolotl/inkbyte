import { InferType, object, string } from "yup";

//***********************************************
//* link
//***********************************************

export const linkCreateSchema = object({
  long_url: string()
    .label("Long URL")
    .transform((payload: string) =>
      payload.replace(/^((https:\/\/)|(http:\/\/))?/, "https://"),
    )
    .url()
    .max(256)
    .required(),
  domain: string().label("Domain").max(24).required(),
  custom_slug: string().label("Custom Alias").max(24),
});

export type LinkCreateSchema = InferType<typeof linkCreateSchema>;
