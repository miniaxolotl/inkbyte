import type { LinkCreateSchema } from "@lib/schema-validator";
import { gen_id } from "@lib/utility";
import { prisma_db } from "@lib/database";

import { get_domain_by_slug } from "./domain.service";

//***********************************************
//* link
//***********************************************

export const get_links = async () => {
  return await prisma_db.link.findMany({
    include: { image: true },
  });
}; // get_links

export const get_link_by_slug = async (slug: string) => {
  return await prisma_db.link.findUnique({
    where: { slug },
    include: {
      domain: true,
      image: true,
    },
  });
}; // get_link

export const create_link = async (
  payload: LinkCreateSchema,
  updated_by = null,
) => {
  const domain = await get_domain_by_slug(payload.domain);
  if (!domain) return null;
  const links = await prisma_db.link.create({
    data: {
      domain_id: domain.id,
      long_url: payload.long_url,
      slug: payload.custom_slug ?? gen_id(8),
      updated_by,
    },
    include: {
      domain: true,
      image: true,
    },
  });
  return links;
}; // get_links
