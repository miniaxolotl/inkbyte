//***********************************************
//* shared
//***********************************************

export type Base = {
  updated?: Date;
  created?: Date;
  deleted?: Date | null;
};

export type IdMap = {
  id: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PageCookies = Record<string, any>;
