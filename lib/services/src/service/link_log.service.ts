import { BaseLinkLog } from "@lib/shared";
import { prisma_db } from "@lib/database";

//***********************************************
//* link_log
//***********************************************

export const create_link_log = async (payload: BaseLinkLog) => {
  const link_log = await prisma_db.linkLog.upsert({
    where: {
      link_id_session_id: {
        session_id: payload.session_id,
        link_id: payload.link_id ?? 0,
      },
    },
    create: payload,
    update: {
      ...payload,
      view_count: { increment: 1 },
    },
    include: {
      link: { include: { domain: true } },
    },
  });
  return link_log;
}; // create_link_log
