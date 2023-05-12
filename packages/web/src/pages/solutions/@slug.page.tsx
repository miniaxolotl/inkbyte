import React from "react";

import * as _ from "lodash";
import { Box, Container, Text, Title } from "@mantine/core";
import { FiTool } from "react-icons/fi/index.js";

import { PageContextServer } from "@lib/vite-react";
import { solutionList } from "@lib/data";

import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

type PageProps = {
  heading: string;
};

export const Page = ({ heading }: PageProps) => {
  const heading_text = _.startCase(heading);
  const solution = solutionList.find((solution) => solution.slug === heading);

  if (!solution) throw new Error(`No solution found for slug: ${heading}`);

  return (
    <>
      <Container>
        <Title size="h1" order={1} color="brand-blue">
          {heading_text}
        </Title>
        <Box
          sx={{
            display: "flex",
            gap: 12,
            "@media (max-width: 680px)": {
              flexDirection: "column",
            },
          }}
        >
          {solutionList.map(({ slug, title }, index) => (
            <Box key={slug} sx={{ display: "flex", gap: 12 }}>
              {!!index && (
                <Box
                  key={`${slug}-divider`}
                  sx={{
                    "::after": { content: '"-"' },
                    "@media (max-width: 680px)": {
                      display: "none",
                    },
                  }}
                />
              )}
              <Link href={`/solutions/${slug}`}>{title}</Link>
            </Box>
          ))}
        </Box>
        <Box>
          <Title
            size="h2"
            order={2}
            sx={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            TODO
            <FiTool />
          </Title>
          <Text>{solution?.description}</Text>
        </Box>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};

export const onBeforeRender = async (props: PageContextServer) => ({
  pageContext: {
    pageProps: { heading: props.routeParams.slug },
  },
});
