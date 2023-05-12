import React from "react";

import { Box, Container, List, Text, Title } from "@mantine/core";

import { featureList, solutionList } from "@lib/data";
import { DomainList } from "@lib/shared";
import { web_config } from "@lib/config";

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
          Sitemap
        </Title>
        <Box>
          <Title size="h3" order={3}>
            Pages
          </Title>
          <Text>
            <List>
              {["/login", "/register", "/sitemap", "/help"].map((path) => (
                <List.Item key={path}>
                  <Link href={path}>
                    {`https://www.${web_config.web_host}${path}`}
                  </Link>
                </List.Item>
              ))}
              {featureList.map(({ slug }) => (
                <List.Item key={slug}>
                  <Link href={`/features/${slug}`}>
                    {`https://www.${web_config.web_host}/features/${slug}`}
                  </Link>
                </List.Item>
              ))}
              {solutionList.map(({ slug }) => (
                <List.Item key={slug}>
                  <Link href={`/solutions/${slug}`}>
                    {`https://www.${web_config.web_host}/solutions/${slug}`}
                  </Link>
                </List.Item>
              ))}
              <List.Item>
                <Link href={`https://${web_config.dashboard_host}`}>
                  {`https://www.${web_config.dashboard_host}`}
                </Link>
              </List.Item>
            </List>
          </Text>
        </Box>
        <Box>
          <Title size="h3" order={3}>
            Domains
          </Title>
          <Text>
            <List>
              {DomainList.map((domain) => (
                <List.Item key={domain}>
                  <Link href={`https://${domain}`}>https://www.{domain}</Link>
                </List.Item>
              ))}
            </List>
          </Text>
        </Box>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
