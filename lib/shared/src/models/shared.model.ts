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
