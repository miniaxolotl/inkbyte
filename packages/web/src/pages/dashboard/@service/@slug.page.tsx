import React from "react";

import { Box, Container, List, Paper, Title } from "@mantine/core";

import { PageContextServer } from "@lib/vite-react";
import { featureList } from "@lib/data";

import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {
  service: string;
  slug: string;
};

// eslint-disable-next-line no-empty-pattern
export const Page = ({ service, slug }: PageProps) => {
  const feature = featureList.find((feature) => feature.slug === service);

  if (!feature) throw new Error(`No feature found for slug: ${service}`);
  const { title } = feature;

  return (
    <>
      <Container>
        <Title size="h1" order={1} color="brand-blue">
          Dashboard
        </Title>
        <Box sx={{ display: "flex", gap: 24 }}>
          <Paper
            shadow="md"
            p="lg"
            sx={{ flex: 1, maxWidth: "max-content" }}
            withBorder
          >
            <List sx={{ listStyleType: "none" }}>
              <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
                <Link href={`/dashboard`}>Overview</Link>
              </List.Item>

              {featureList.map(({ slug, title }) => (
                <List.Item
                  key={slug}
                  sx={{ fontFamily: "'Secular One', sans-serif" }}
                >
                  {/* <Title size="h3" order={3} color="brand-green"> */}
                  <Link href={`/dashboard/${slug}`}>{title}</Link>
                  {/* </Title> */}
                </List.Item>
              ))}

              <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
                <Link href={`/dashboard/subscription`} isDisabled>
                  Subscription
                </Link>
              </List.Item>
            </List>
          </Paper>
          <Paper shadow="md" p="md" sx={{ flex: 1, flexGrow: 1 }} withBorder>
            <Title size="h2" order={2} color="brand-blue">
              {title}
            </Title>
            <Title size="h3" order={3} color="brand-red">
              {slug}
            </Title>
          </Paper>
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
    pageProps: {
      service: props.routeParams.service,
      slug: props.routeParams.slug,
    },
  },
});
