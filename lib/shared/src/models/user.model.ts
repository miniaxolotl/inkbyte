//***********************************************
//* user
//***********************************************

export type BaseUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  birth_date?: Date | string | null;
  user_image: string;
};

export type BaseEditor = BaseUser;
