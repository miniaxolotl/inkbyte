//***********************************************
//* link
//***********************************************

import { DomainModel } from "./domain.model";
import { ImageModel } from "./image.model";

export type BaseLink = {
  id?: number;
  slug: string;
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
  domain: DomainModel;
  updated?: Date;
  created?: Date;
  deleted?: Date | null;
};
