import React from "react";

import { Box } from "@mantine/core";

import { featureList, solutionList } from "@lib/data";
import { web_config } from "@lib/config";

import {
  DesktopNavigation,
  DesktopNavigationItem,
  MobileNavigation,
  MobileNavigationItem,
  MobileNavigationList,
} from "@components/layout/navigation";
import { FooterDefault } from "@components/layout/footer";
import { Link } from "@components/core";
import { Waves } from "@components/display";

export type LayoutDefaultProps = {
  children?: React.ReactNode;
};

export const Content = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = false;

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
          <Link href={`/features/${featureList[0].slug}`}>Features</Link>
        </DesktopNavigationItem>

        <DesktopNavigationItem>
          <Link href={`/solutions/${solutionList[0].slug}`}>Solutions</Link>
        </DesktopNavigationItem>

        {isLoggedIn ? (
          <DesktopNavigationItem>
            <Link href="/dashboard">Dashboard</Link>
          </DesktopNavigationItem>
        ) : (
          <DesktopNavigationItem>
            <Link href="/login">Login</Link>
            <Box sx={{ "::after": { content: "'/'" } }} />
            <Link href="/register">Register</Link>
          </DesktopNavigationItem>
        )}
      </DesktopNavigation>

      <MobileNavigation title={web_config.app_title} sx={{ padding: 24 }}>
        <MobileNavigationList title="Account">
          {isLoggedIn ? (
            <MobileNavigationItem>
              <Link href="/dashboard">Dashboard</Link>
            </MobileNavigationItem>
          ) : (
            <>
              <MobileNavigationItem>
                <Link href="/login">Login</Link>
                <Box sx={{ "::after": { content: "'/'" } }} />
                <Link href="/register">Register</Link>
              </MobileNavigationItem>
            </>
          )}
        </MobileNavigationList>
        <MobileNavigationList title="Help">
          <MobileNavigationItem>
            <Link href={`/features/${featureList[0].slug}`}>Features</Link>
          </MobileNavigationItem>
          <MobileNavigationItem>
            <Link href={`/solutions/${solutionList[0].slug}`}>Solutions</Link>
          </MobileNavigationItem>
        </MobileNavigationList>
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
