import React from "react";

import { Container } from "@mantine/core";

import { LayoutDefault } from "@components/layout";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {};

// eslint-disable-next-line no-empty-pattern
export const Page = ({}: PageProps) => {
  return (
    <>
      <Container>
        <Container sx={{ textAlign: "center" }}>
          <h1>Login</h1>
        </Container>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
