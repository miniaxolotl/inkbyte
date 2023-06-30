import React, { useState } from "react";

import { Container, Title } from "@mantine/core";

import { PageContextServer } from "@lib/vite-react";
import { useMount } from "@lib/hooks";

import { LayoutDefault } from "@components/layout";
import { useStore } from "@stores";

type PageProps = {
  slug: string;
  origin: string;
  referer: string;
  userAgent: string;
};

export const Page = ({ slug, origin, referer }: PageProps) => {
  const { link } = useStore();
  const [success, setSuccess] = useState(true);

  useMount(async () => {
    const response = await link.fetchLink(slug, { origin, referer });
    if (response.ok) {
      const data = response.data;
      link.openLink(data.long_url);
    } else {
      setSuccess(false);
    }
  });

  return (
    <>
      <Container>
        <Title size="h2" order={2} align="center">
          {success ? "opening link..." : "error loading link..."}
        </Title>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};

export const onBeforeRender = async (props: PageContextServer) => {
  return {
    pageContext: {
      pageProps: {
        slug: props.routeParams.slug,
        origin: props.origin,
        referer: props.referer,
        userAgent: props.userAgent,
      },
    },
  };
};
