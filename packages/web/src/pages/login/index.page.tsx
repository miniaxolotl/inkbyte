import React from "react";

import { ActionIcon, Box, Container, Text, Title } from "@mantine/core";
import { IoLogoApple, IoLogoGoogle } from "react-icons/io/index.js";

import { Link, TextDivider } from "@components/core";
import { FormLogin } from "@components/forms";
import { LayoutDefault } from "@components/layout";

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
            {"Don't have an account? "}
            <Link href="/create-account">Create Account</Link>
          </Text>
          <Box>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <FormLogin />
            </Box>
            <TextDivider sx={{ maxWidth: 680 }}>OR</TextDivider>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ActionIcon variant="filled" color="brand-green" disabled>
                  <IoLogoGoogle />
                </ActionIcon>
                <ActionIcon variant="filled" color="brand-green" disabled>
                  <IoLogoApple />
                </ActionIcon>
              </Box>
              <Text size="xs" color="gray">
                soon
              </Text>
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
