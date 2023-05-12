import React from "react";

import {
  ActionIcon,
  Box,
  BoxProps,
  Drawer,
  List,
  ListProps,
  Title,
} from "@mantine/core";
import { FiMenu } from "react-icons/fi/index.js";
import { useDisclosure } from "@mantine/hooks";

import { Link } from "@components/core";

import {
  DesktopNavigationItem,
  DesktopNavigationList,
} from "./desktop-navigation";

export type MobileNavigationProps = BoxProps & {
  children?: React.ReactNode;
  title: string;
};

export const MobileNavigation = ({
  children,
  sx,
  title,
}: MobileNavigationProps) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Box
      sx={{
        ...sx,
        justifyContent: "space-between",
        display: "none",
        visibility: "hidden",
        "@media (max-width: 680px)": {
          display: "flex",
          visibility: "visible",
        },
      }}
    >
      <DesktopNavigationList sx={{ flex: 1 }}>
        <DesktopNavigationItem>
          <Title size="h2" order={1}>
            <Link href="/">{title}</Link>
          </Title>
        </DesktopNavigationItem>
      </DesktopNavigationList>

      <DesktopNavigationList
        sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}
      >
        <DesktopNavigationItem>
          <ActionIcon size="xl" onClick={open}>
            <FiMenu size={24} />
          </ActionIcon>
        </DesktopNavigationItem>
      </DesktopNavigationList>

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
        {children}
      </Drawer>
    </Box>
  );
};

export const MobileNavigationList = ({ sx, children }: ListProps) => (
  <List
    sx={{
      ...sx,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      li: {
        listStyle: "none",
        display: "flex",
        alignItems: "center",
      },
      "span, a": {
        display: "flex",
        alignItems: "center",
        gap: 4,
      },
    }}
  >
    {children}
  </List>
);

export const MobileNavigationItem = ({
  children,
}: {
  children?: React.ReactNode;
}) => <List.Item>{children}</List.Item>;
