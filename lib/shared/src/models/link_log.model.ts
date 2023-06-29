//***********************************************
//* link_log
//***********************************************

import { DomainModel } from "./domain.model";
import { ImageModel } from "./image.model";

export type BaseLinkLog = {
  link_id?: number;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  delta?: number;
};

export type LinkLogModel = BaseLinkLog & {
  image?: ImageModel;
  domain: DomainModel;
  updated?: Date;
  created?: Date;
  deleted?: Date | null;
};
