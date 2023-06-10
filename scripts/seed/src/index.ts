import { PermissionRoleEnum, PermissionRoleMap } from "@lib/shared";
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

(async () => {
  await connect_prisma();
  await seed_roles();
  process.exit(0);
})();
