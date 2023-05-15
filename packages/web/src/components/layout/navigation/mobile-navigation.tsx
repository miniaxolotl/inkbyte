import React from "react";

import {
  ActionIcon,
  Box,
  BoxProps,
  Drawer,
  Image,
  List,
  ListProps,
  Text,
  TitleOrder,
  Transition,
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
  disableLogo?: boolean;
};

export const MobileNavigation = ({
  children,
  sx,
  title,
  disableLogo,
}: MobileNavigationProps) => {
  const [opened, { open, close }] = useDisclosure(false);

  const slideIn = {
    in: { top: "0vh", width: 28 },
    out: { top: "100vw", width: 0 },
    transitionProperty: "top, width",
  };

  const slideOut = {
    in: { bottom: "0px", width: 28 },
    out: { bottom: "20vh", width: 0 },
    transitionProperty: "bottom, width",
  };

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
        <DesktopNavigationItem size={24} order={2}>
          <Link
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Transition
              mounted={!disableLogo}
              transition={!disableLogo ? slideIn : slideOut}
              duration={800}
              timingFunction="linear"
              keepMounted
            >
              {/* {!disableLogo && ( */}
              {(styles) => (
                <Image
                  sx={{ position: "relative", zIndex: -10 }}
                  style={{ ...styles }}
                  src="/assets/logo/default.svg"
                  alt="Logo"
                  height={28}
                  width={28}
                />
              )}
              {/* )} */}
            </Transition>
            {title}
          </Link>
        </DesktopNavigationItem>
      </DesktopNavigationList>

      <DesktopNavigationList
        sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}
      >
        <DesktopNavigationItem>
          <ActionIcon size="xl" onClick={open} aria-label="Mobile Menu Button">
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

export type MobileNavigationListProps = ListProps & {
  title?: string;
};

export const MobileNavigationList = ({
  sx,
  children,
  title,
}: MobileNavigationListProps) => (
  <Box>
    {title && (
      <Text size="sm" sx={{ fontWeight: 600 }}>
        {title}
      </Text>
    )}
    <List
      sx={{
        ...sx,
        display: "flex",
        flexDirection: "column",
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
  </Box>
);

export const MobileNavigationItem = ({
  children,
  size,
}: {
  children?: React.ReactNode;
  size?: string;
  order?: TitleOrder;
}) => (
  <List.Item>
    <Text
      size={size ?? "xl"}
      weight={600}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "'Secular One', sans-serif",
      }}
    >
      {children}
    </Text>
  </List.Item>
);

export const MobileNavigationItemGroup = ({
  children,
  size,
  items,
}: {
  children?: React.ReactNode;
  size?: string;
  order?: TitleOrder;
  items?: { label: string; href: string; slug: string }[];
}) => (
  <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
    <MobileNavigationList>
      <MobileNavigationItem>
        <Text
          size={size ?? "lg"}
          weight={600}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "'Secular One', sans-serif",
          }}
        >
          {children}
        </Text>
      </MobileNavigationItem>

      {items &&
        items.map(({ label, href, slug }) => (
          <MobileNavigationItem key={slug}>
            <Link
              href={href}
              size={size ?? "md"}
              sx={{ fontFamily: "'Secular One', sans-serif" }}
            >
              {label}
            </Link>
          </MobileNavigationItem>
        ))}
    </MobileNavigationList>
  </List.Item>
);
