import React from "react";

import { Box, Container, Title } from "@mantine/core";
import { FiTool } from "react-icons/fi/index.js";

import { LayoutDefault } from "@components/layout";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {};

// eslint-disable-next-line no-empty-pattern
export const Page = ({}: PageProps) => {
  return (
    <>
      <Container>
        <Title size="h2" order={2} color="brand-blue">
          Features
        </Title>
        <Box>
          <Title
            size="h3"
            order={3}
            sx={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            TODO
            <FiTool />
          </Title>
        </Box>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
