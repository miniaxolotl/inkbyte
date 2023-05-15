import React from "react";

import { Box, Container, Text, Title } from "@mantine/core";

import { FormForgotPassword } from "@components/forms";
import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {};

// eslint-disable-next-line no-empty-pattern
export const Page = ({}: PageProps) => {
  return (
    <>
      <Container>
        <Title
          size="h1"
          order={1}
          color="brand-blue"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Login
        </Title>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Text sx={{ textAlign: "center" }}>
            {"Remember your password? "}
            <Link href="/login">Login</Link>
          </Text>
          <Box>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <FormForgotPassword />
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
