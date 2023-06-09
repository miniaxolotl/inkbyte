//***********************************************
//* user
//***********************************************

export type BaseUser = {
  id?: number;
  email: string;
  first_name: string;
  last_name: string;
  last_ip?: string;
  image: string;
};

export type BaseEditor = BaseUser;
