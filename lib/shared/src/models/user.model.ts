//***********************************************
//* user
//***********************************************

import { ImageModel } from "./image.model";

export type BaseUser = {
  id: number;
  uid?: string;
  email: string;
  first_name: string;
  last_name: string;
  last_ip?: string | null;
  verification_date?: Date | null;
  verification_token?: string | null;
};

export type BaseEditor = BaseUser;

export type UserModel = BaseUser & {
  image?: ImageModel;
  updated: Date;
  created: Date;
  deleted?: Date | null;
};
