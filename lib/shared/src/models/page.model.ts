//***********************************************
//* page.model.ts
//***********************************************

import { BaseCoverImage } from "./shared.model";

export type BaseGlobalPage = {
  title: string;
  description?: string;
  date_created?: string;
  date_updated?: string;
};

export type BasePage = BaseCoverImage & {
  // TODO: Add a type for the images array
  images: {
    id: string;
    directus_files_id: { id: string; description: string };
  }[];
  heading: string;
  subheading?: string;
  content: string;
  content_preview?: string;
  date_created?: string;
  date_updated?: string;
};
