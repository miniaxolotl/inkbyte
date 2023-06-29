import React, { useState } from "react";

import { Container, Text } from "@mantine/core";

import { PageContextServer } from "@lib/vite-react";
import { useMount } from "@lib/hooks";

import { LayoutDefault } from "@components/layout";
import { useStore } from "@stores";

type PageProps = {
  slug: string;
};

export const Page = ({ slug }: PageProps) => {
  const { link } = useStore();
  const [success, setSuccess] = useState(true);

  useMount(async () => {
    const response = await link.fetchLink(slug);
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
        <Text align="center">
          {success ? "opening link..." : "error loading link..."}{" "}
        </Text>
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
      pageProps: { slug: props.routeParams.slug },
    },
  };
};
