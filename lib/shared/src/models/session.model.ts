import { BaseUser } from "./user.model";

//***********************************************
//* session
//***********************************************

export type BaseSession = {
  id?: number;
  token: string;
  user_id: number;
};

export type SessionModel = BaseSession & {
  user: BaseUser;
  updated: Date;
  created: Date;
  deleted?: Date | null;
};
