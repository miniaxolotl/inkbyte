import React from "react";

import { Box, Container, Title } from "@mantine/core";

import { featureList } from "@lib/data";

import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

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
          {featureList.map(({ slug, title }) => (
            <Title
              order={3}
              size="h3"
              key={slug}
              sx={{ display: "flex", gap: 12 }}
            >
              <Link href={`/solutions/${slug}`}>{title}</Link>
            </Title>
          ))}
        </Box>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
