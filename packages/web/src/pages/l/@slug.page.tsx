import React from "react";

import { Container, Text } from "@mantine/core";
import { RenderErrorPage } from "vite-plugin-ssr/RenderErrorPage";

import { PageContextServer } from "@lib/vite-react";
import { useMount } from "@lib/hooks";

import { LayoutDefault } from "@components/layout";
import { LinkModel } from "@lib/shared";
import { Quikk } from "@lib/quikk";
import { useStore } from "@stores";
import { web_config } from "@lib/config";

type PageProps = {
  slug: string;
};

export const Page = ({ slug }: PageProps) => {
  const { link } = useStore();

  useMount(async () => {
    const response = await link.fetchLink(slug);
    if (response.ok) {
      const data = response.data;
      link.openLink(data.long_url);
    }
  });

  return (
    <>
      <Container>
        <Text align="center">opening link...</Text>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};

export const onBeforeRender = async (props: PageContextServer) => {
  const { get } = new Quikk({
    protocol: web_config.env === "development" ? "http" : "https",
    base_port:
      web_config.env === "development" ? web_config.api_port : undefined,
    base_url: web_config.api_host,
    base_path: "api",
    api_version: "v1",
  });

  const response = await get<LinkModel>(`r/${props.routeParams.slug}`, {
    headers: {
      "Session-Id": props.cookies.session_id,
    },
  });

  if (!response.ok) {
    throw RenderErrorPage({
      pageContext: {
        is404: false,
        pageProps: {
          heading: "404 Link Not Found",
          message: `Link Does Not Exist!`,
        },
      },
    });
  }

  return {
    pageContext: {
      redirectTo: response.data.long_url,
      pageProps: { slug: props.routeParams.slug },
    },
  };
};
