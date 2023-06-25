//***********************************************
//* link
//***********************************************

import { ImageModel } from "./image.model";

export type BaseLink = {
  id?: number;
  slug: "982a5f";
  long_url: string;
  is_tracking?: boolean;
  cta_heading?: string;
  cta_body?: string;
  cta_action?: string;
  // archived: Date;
  // updated_by?: number | null;
};

export type LinkModel = BaseLink & {
  image?: ImageModel;
  updated?: Date;
  created?: Date;
  deleted?: Date | null;
};
