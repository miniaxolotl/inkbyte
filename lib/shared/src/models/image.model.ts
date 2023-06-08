import { BaseEditor } from ".";

//***********************************************
//* image
//***********************************************

export type BaseImage = {
  id?: number;
  uid: string;
  slug: string;
  bucket: string;
  mime: string;
  path: string;
  filename: string;
  filetype?: string | null;
  endpoint: string;
  region: string;
  updated_by?: number | null;
};

export type ImageJoin = BaseImage & {
  editor?: BaseEditor;
  updated?: Date;
  created?: Date;
  deleted?: Date | null;
};
