import React from "react";

import { Box, Container, Divider, Image } from "@mantine/core";

import { DomainList } from "@lib/shared";
import { featureList } from "@lib/data";

import { BaseList, FeaturedListItem } from "@components/display";
import { FormCreateLink } from "@components/forms";
import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {};

// eslint-disable-next-line no-empty-pattern
export const Page = ({}: PageProps) => {
  return (
    <>
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 72,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Link href="/">
              <Image
                src="/assets/logo/default.svg"
                alt="Logo"
                height={112}
                width={112}
                sx={{ padding: 16 }}
              />
            </Link>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FormCreateLink links={DomainList} />
          </Box>
        </Box>

        <Divider />

        <BaseList
          items={featureList}
          id_key="title"
          item_type={FeaturedListItem}
        />
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
