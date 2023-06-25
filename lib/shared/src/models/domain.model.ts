//***********************************************
//* link
//***********************************************

import { ImageModel } from "./image.model";

export type BaseDomain = {
  id?: number;
  slug: string;
};

export type DomainModel = BaseDomain & {
  image?: ImageModel;
  updated?: Date;
  created?: Date;
  deleted?: Date | null;
};
