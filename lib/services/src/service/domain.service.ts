import { prisma_db } from "@lib/database";

//***********************************************
//* domain
//***********************************************

export const get_domain_by_slug = async (slug: string) => {
  const domain = await prisma_db.domain.findUnique({
    where: { slug },
  });
  return domain;
}; // get_domain_by_slug
