import { InferType, object, string } from "yup";

//***********************************************
//* user
//***********************************************

export const createLinkSchema = object({
  long_url: string().label("Long URL").url().max(256).required(),
  domain: string().label("Domain").max(24).required(),
  custom_slug: string().label("Custom Alias").max(24),
});

export type CreateLinkSchema = InferType<typeof createLinkSchema>;
