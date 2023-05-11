import React from "react";

import { Container } from "@mantine/core";

import { LayoutDefault } from "@components/layout";

export { Page };

function Page({ is404 }: { is404: boolean }) {
  if (is404) {
    return (
      <LayoutDefault>
        <Container sx={{ textAlign: "center" }}>
          <h1>404 Page Not Found</h1>
          <p>This page could not be found.</p>
        </Container>
      </LayoutDefault>
    );
  } else {
    return (
      <LayoutDefault>
        <Container sx={{ textAlign: "center" }}>
          <h1>500 Internal Server Error</h1>
          <p>Something went wrong.</p>
        </Container>
      </LayoutDefault>
    );
  }
}
