import React from "react";

import * as _ from "lodash";
import {
  Box,
  Button,
  Container,
  List,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import { FiCheckCircle } from "react-icons/fi/index.js";

import { PageContextServer } from "@lib/vite-react";
import { featureList } from "@lib/data";

import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

type PageProps = {
  heading: string;
};

export const Page = ({ heading }: PageProps) => {
  const heading_text = _.startCase(heading);
  const feature = featureList.find((feature) => feature.slug === heading);

  if (!feature) throw new Error(`No feature found for slug: ${heading}`);
  const { subtitle, description, benefits_long, Icon } = feature;

  return (
    <>
      <Container>
        <Box sx={{ padding: "0 0 24px" }}>
          <Title
            size="h1"
            order={1}
            color="brand-blue"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon />
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
            {featureList.map(({ slug, title }, index) => (
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
                <Link href={`/features/${slug}`}>{title}</Link>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Box>
            <Title size="h2" order={2}>
              {subtitle}
            </Title>
            <Text>{description}</Text>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Link href="/create-account">
              <Button
                color="brand-green"
                sx={{
                  "@media (max-width: 680px)": {
                    flexGrow: 1,
                  },
                }}
              >
                Get Started Free
              </Button>
            </Link>
          </Box>

          <Box>
            <Title size="h2" order={2}>
              Benefits
            </Title>

            <Paper
              shadow="md"
              p="md"
              sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                borderWidth: 2,
                // border: "2px solid grey",
              }}
              withBorder
            >
              <List
                sx={{
                  listStyleType: "none",
                  li: {
                    display: "flex",
                    flexDirection: "row",
                  },
                  span: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    svg: {
                      stroke: "green",
                    },
                  },
                }}
              >
                {benefits_long
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((benefit) => (
                    <List.Item
                      key={_.kebabCase(benefit.title)}
                      sx={{
                        span: {
                          display: "flex",
                          flexDirection: "column",
                          placeItems: "flex-start",
                        },
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <FiCheckCircle size={24} />
                        <Text weight={600} color="brand-green">
                          {benefit.title}
                        </Text>
                      </Box>
                      <Text>{benefit.description}</Text>
                    </List.Item>
                  ))}
              </List>
            </Paper>
          </Box>
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
