import React from "react";

import { Box, BoxProps, List, ListItemProps } from "@mantine/core";
import { FiHeart } from "react-icons/fi/index.js";
import { MdCopyright } from "react-icons/md/index.js";

import { web_config } from "@lib/config";

import { Link } from "@components/core";

export type FooterDefaultProps = BoxProps & {
  children?: React.ReactNode;
};

export const FooterDefault = ({ children, sx }: FooterDefaultProps) => {
  return (
    <Box sx={{ ...sx, li: { color: "white" } }}>
      <FooterList>
        {children && <FooterList>{children}</FooterList>}
        <FooterListItem>
          Made with <FiHeart size={14} />
          by <Link href="https://mawa.dev">Elias Mawa</Link>
        </FooterListItem>
      </FooterList>
      <FooterList>
        <FooterListItem sx={{ fontSize: 14 }}>
          <MdCopyright />
          {web_config.app_title} {new Date().getFullYear()}
        </FooterListItem>
      </FooterList>
    </Box>
  );
};

const FooterList = ({ children }: { children?: React.ReactNode }) => (
  <List
    sx={{
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
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

export const FooterListItem = ({ children, sx }: ListItemProps) => (
  <List.Item sx={{ ...sx }}>{children}</List.Item>
);
