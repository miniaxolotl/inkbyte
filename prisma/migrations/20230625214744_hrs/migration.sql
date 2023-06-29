-- AddForeignKey
ALTER TABLE `Link` ADD CONSTRAINT `Link_domain_id_fkey` FOREIGN KEY (`domain_id`) REFERENCES `Domain`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
