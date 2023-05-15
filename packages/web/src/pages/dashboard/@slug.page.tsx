import React, { useId } from "react";

import { Box, Container, List, Paper, Table, Title } from "@mantine/core";

import { PageContextServer } from "@lib/vite-react";
import { featureList } from "@lib/data";

import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {
  heading: string;
};

// eslint-disable-next-line no-empty-pattern
export const Page = ({ heading }: PageProps) => {
  const feature = featureList.find((feature) => feature.slug === heading);

  if (!feature) throw new Error(`No feature found for slug: ${heading}`);
  const { title } = feature;

  const id1 = useId();
  const id2 = useId();
  const sum1 = id1.split("").reduce((acc, cur) => acc + cur.charCodeAt(0), 0);
  const sum2 = id2.split("").reduce((acc, cur) => acc + cur.charCodeAt(0), 0);
  const sum = sum1 + sum2;

  const elements = Array(8)
    .fill(0)
    .map((_, index) => ({
      id: index + 1,
      URL: `example.com/${index}`,
      code: (sum * (index + 2) + "")
        .split("")
        .reduce(
          (acc, char) =>
            acc +
            String.fromCharCode("a".charCodeAt(0) + (char.charCodeAt(0) % 26)),
          "",
        ),
      clicks: (sum * (index + 2)).toFixed(),
    }));

  const rows = elements.map((element) => (
    <tr key={element.id}>
      <td>{element.id}</td>
      <td>{element.URL}</td>
      <td>{element.code}</td>
      <td>{element.clicks}</td>
    </tr>
  ));

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
            sx={{
              flex: 1,
              maxWidth: "max-content",
              "@media (max-width: 680px)": {
                flexDirection: "column",
              },
            }}
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

              {/* <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
                <Link href={`/dashboard/subscription`} isDisabled>
                  Subscription
                </Link>
              </List.Item> */}
            </List>
          </Paper>

          <Paper
            shadow="md"
            p="md"
            sx={{
              flex: 1,
              flexGrow: 1,
              "@media (max-width: 680px)": {
                maxWidth: "unset",
              },
            }}
            withBorder
          >
            <Title size="h2" order={2} color="brand-blue">
              {title}
            </Title>
            <Box>
              <Table highlightOnHover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
                    <th>Code</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </Table>
            </Box>
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
    pageProps: { heading: props.routeParams.slug },
  },
});
