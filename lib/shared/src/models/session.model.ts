import { UserModel } from "./user.model";

//***********************************************
//* session
//***********************************************

export type BaseSession = {
  id?: number;
  token: string;
  user_id: number;
};

export type SessionModel = BaseSession & {
  user: UserModel;
  updated: Date;
  created: Date;
  deleted?: Date | null;
};
