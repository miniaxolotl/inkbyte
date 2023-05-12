import React from "react";

import { Box, Container, List, Text, Title } from "@mantine/core";

import { DomainList } from "@lib/shared";

import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";
import { web_config } from "@lib/config";

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
              {["/features", "/login", "/register", "/sitemap", "/help"].map(
                (path) => (
                  <List.Item key={path}>
                    <Link href={`https://${web_config.web_host}${path}`}>
                      {`https://www.${web_config.web_host}${path}`}
                    </Link>
                  </List.Item>
                ),
              )}
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
