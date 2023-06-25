import { DomainList, PermissionRoleEnum, PermissionRoleMap } from "@lib/shared";
import { connect_prisma, prisma_db } from "@lib/database";

const seed_roles = async () => {
  console.log("[start]: seed_roles");
  const keys = Object.keys(PermissionRoleEnum);
  for (const key of keys) {
    console.log(` - [seed]: ${key}`);
    const role = PermissionRoleEnum[key as keyof typeof PermissionRoleEnum];
    await prisma_db.role.upsert({
      where: { id: PermissionRoleMap[role].id },
      create: {
        id: PermissionRoleMap[role].id,
        slug: PermissionRoleMap[role].slug,
        authority: PermissionRoleMap[role].authority,
      },
      update: {
        slug: PermissionRoleMap[role].slug,
        authority: PermissionRoleMap[role].authority,
      },
    });
  }
  console.log("[end]: seed_roles");
};

const seed_domains = async () => {
  console.log("[start]: seed_domains");
  for (const value of DomainList) {
    console.log(` - [seed]: ${value}`);
    await prisma_db.domain.upsert({
      where: { slug: value },
      create: {
        slug: value,
        updated_by: null,
      },
      update: {
        slug: value,
        updated_by: null,
      },
    });
  }
  console.log("[end]: seed_domains");
};

(async () => {
  await connect_prisma();
  await seed_roles();
  await seed_domains();
  process.exit(0);
})();
