import React from "react";

import { ActionIcon, Box, Drawer, Modal, Title } from "@mantine/core";
import { FiMenu } from "react-icons/fi/index.js";
import { useDisclosure } from "@mantine/hooks";

import { web_config } from "@lib/config";

import {
  DesktopNavigation,
  DesktopNavigationItem,
  MobileNavigation,
  MobileNavigationItem,
} from "@components/layout/navigation";
import { FooterDefault } from "@components/layout/footer";
import { Link } from "@components/core";
import { Waves } from "@components/display";

export type LayoutDefaultProps = {
  children?: React.ReactNode;
};

export const Content = ({ children }: { children: React.ReactNode }) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <DesktopNavigation title={web_config.app_title} sx={{ padding: 24 }}>
        <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/features">Features</Link>
          </Title>
        </DesktopNavigationItem>

        <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/dashboard">Dashboard</Link>
          </Title>
        </DesktopNavigationItem>
        {/* <DesktopNavigationItem>
          <ActionIcon variant="filled" color="brand-blue">
            <FiClock />
          </ActionIcon>
        </DesktopNavigationItem> */}
        <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/login">Login</Link>
          </Title>
          /
          <Title size="h4" order={2}>
            <Link href="/register">Register</Link>
          </Title>
        </DesktopNavigationItem>
        {/* <DesktopNavigationItem>
          <Link href="/register">
            <Button leftIcon={<FiUser />} color="brand-cerulean">
              Register
            </Button>
          </Link>
        </DesktopNavigationItem> */}
        {/* <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/register">
              Register
              <FiUserPlus />
            </Link>
          </Title>
        </DesktopNavigationItem> */}
        {/* <DesktopNavigationItem>
          <Title size="h4" order={2}>
            <Link href="/login">
              Login
              <FiLogIn />
            </Link>
          </Title>
        </DesktopNavigationItem> */}
      </DesktopNavigation>

      <MobileNavigation title={web_config.app_title} sx={{ padding: 24 }}>
        <MobileNavigationItem>
          <Drawer
            opened={opened}
            onClose={close}
            title="Menu"
            size="xs"
            position="right"
            overlayProps={{
              opacity: 0.5,
              blur: 4,
            }}
            sx={{
              ".mantine-Drawer-header": { padding: 24 },
              "	.mantine-Drawer-close": { width: 24, height: 24 },
            }}
          >
            {/* Drawer content */}
          </Drawer>

          <ActionIcon size="xl" onClick={open}>
            <FiMenu size={24} />
          </ActionIcon>
        </MobileNavigationItem>
      </MobileNavigation>

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
