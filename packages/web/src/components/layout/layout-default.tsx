import React from "react";

import { Box, Title } from "@mantine/core";
import { FiClock, FiLogIn, FiUserPlus } from "react-icons/fi/index.js";

import { web_config } from "@lib/config";

import {
  DesktopNavigation,
  DesktopNavigationItem,
} from "@components/layout/navigation";
import { FooterDefault } from "@components/layout/footer";
import { Link } from "@components/core";
import { Waves } from "@components/display";

export type LayoutDefaultProps = {
  children?: React.ReactNode;
};

export const Content = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <DesktopNavigation title={web_config.app_title} sx={{ padding: 16 }}>
        <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/history">
              <FiClock />
              History
            </Link>
          </Title>
        </DesktopNavigationItem>
        <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/register">
              Register
              <FiUserPlus />
            </Link>
          </Title>
        </DesktopNavigationItem>
        <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/login">
              Login
              <FiLogIn />
            </Link>
          </Title>
        </DesktopNavigationItem>
      </DesktopNavigation>
      <Box sx={{ flex: 1, flexGrow: 1, padding: "16px 0" }}>{children}</Box>
      <FooterDefault sx={{ padding: 16 }} />
      <Waves />
    </Box>
  );
};

export const LayoutDefault = (props: LayoutDefaultProps) => {
  return (
    <>
      {/* TODO: Generate SEO */}
      <Content>{props.children}</Content>
    </>
  );
};
