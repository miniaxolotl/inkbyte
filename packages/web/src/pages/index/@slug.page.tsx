import React from "react";

import { Container } from "@mantine/core";

import { PageContextServer } from "@lib/vite-react";

import { LayoutDefault } from "@components/layout";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {
  slug: string;
};

// eslint-disable-next-line no-empty-pattern
export const Page = ({ slug }: PageProps) => {
  return (
    <>
      <Container>{slug}</Container>
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
