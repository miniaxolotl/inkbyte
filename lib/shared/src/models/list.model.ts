//***********************************************
//* list.model.ts
//***********************************************

import { BaseCoverImage } from "./shared.model";
import { BaseUser } from "./user.model";

export type BaseList = {
  id: string;
  list_items: BaseListItem[];
  date_created?: string;
  date_updated?: string;
};

export type BaseListItem = BaseCoverImage & {
  id: string;
  title: string;
  content: string;
  content_preview: string;
  date_created?: string;
  date_updated?: string;
};

export type BaseMemberList = BaseCoverImage & {
  id: string;
  list_items: BaseMemberListItem[];
  date_created?: string;
};

export type BaseMemberListItem = BaseCoverImage & {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  info: string;
  email: string;
  social_instagram: string;
  roles: string[];
  user: BaseUser;
  date_created?: string;
  date_updated?: string;
};

export type BaseCommunityBranchListItem = BaseCoverImage & {
  id: string;
  heading: string;
  abbreviation: string;
  date_created?: string;
  date_updated?: string;
};
