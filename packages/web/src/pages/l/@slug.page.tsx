import React from "react";

import { Container } from "@mantine/core";

import { PageContextServer } from "@lib/vite-react";
import { useMount } from "@lib/hooks";

import { LayoutDefault } from "@components/layout";
import { useStore } from "@stores";

type PageProps = {
  slug: string;
};

export const Page = ({ slug }: PageProps) => {
  const { link } = useStore();

  useMount(async () => {
    const response = await link.fetchLink(slug);
    if (response) link.openLink(response.long_url);
  });

  return (
    <>
      <Container>opening link...</Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};

export const onBeforeRender = async (props: PageContextServer) => ({
  pageContext: {
    pageProps: { slug: props.routeParams.slug },
  },
});
