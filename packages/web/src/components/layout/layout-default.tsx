import React from "react";

import { Box } from "@mantine/core";

// import { featureList, solutionList } from "@lib/data";
import { web_config } from "@lib/config";

import {
  DesktopNavigation,
  DesktopNavigationItem,
  // DesktopNavigationItemDropdown,
  MobileNavigation,
  MobileNavigationItem,
  MobileNavigationList,
} from "@components/layout/navigation";
import { FooterDefault } from "@components/layout/footer";
import { Link } from "@components/core";
import { Waves } from "@components/display";

export type LayoutDefaultProps = {
  children?: React.ReactNode;
  disableLogo?: boolean;
};

export const Content = ({ children, disableLogo }: LayoutDefaultProps) => {
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
      <DesktopNavigation
        title={web_config.appname}
        sx={{ padding: 24 }}
        disableLogo={disableLogo}
      >
        {/* <DesktopNavigationItemDropdown
          items={featureList.map(({ title, slug }) => ({
            label: title,
            href: `/features/${slug}`,
            slug: slug,
          }))}
        >
          <Link>Features</Link>
        </DesktopNavigationItemDropdown> */}

        {/* <DesktopNavigationItemDropdown
          items={solutionList.map(({ title, slug }) => ({
            label: title,
            href: `/solutions/${slug}`,
            slug: slug,
          }))}
        >
          <Link>Solutions</Link>
        </DesktopNavigationItemDropdown> */}

        {/* <DesktopNavigationItem> */}
        {/* <Link href={`/features/${featureList[0].slug}`}>Features</Link> */}
        {/* <Link href={`/features`}>Features</Link> */}
        {/* </DesktopNavigationItem> */}

        {/* <DesktopNavigationItem> */}
        {/* <Link href={`/solutions/${solutionList[0].slug}`}>Solutions</Link> */}
        {/* <Link href={`/solutions`}>Solutions</Link> */}
        {/* </DesktopNavigationItem> */}

        {isLoggedIn ? (
          <DesktopNavigationItem>
            <Link href="/dashboard">Dashboard</Link>
          </DesktopNavigationItem>
        ) : (
          <DesktopNavigationItem>
            <Link href="/login">Login</Link>
            <Box sx={{ "::after": { content: "'/'" } }} />
            <Link href="/create-account">Create Account</Link>
          </DesktopNavigationItem>
        )}
      </DesktopNavigation>

      <MobileNavigation
        title={web_config.appname}
        sx={{ padding: 24 }}
        disableLogo={disableLogo}
      >
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
                <Link href="/create-account">Create Account</Link>
              </MobileNavigationItem>
            </>
          )}
        </MobileNavigationList>

        {/* <MobileNavigationList title="Features">
          {featureList.map(({ title, slug }) => (
            <MobileNavigationItem key={slug}>
              <Link href={`/features/${slug}`}>{title}</Link>
            </MobileNavigationItem>
          ))}
        </MobileNavigationList> */}

        {/* <MobileNavigationList title="Solutions">
          {solutionList.map(({ title, slug }) => (
            <MobileNavigationItem key={slug}>
              <Link href={`/solutions/${slug}`}>{title}</Link>
            </MobileNavigationItem>
          ))}
        </MobileNavigationList> */}

        {/* <MobileNavigationItem> */}
        {/* <Link href={`/features/${featureList[0].slug}`}>Features</Link> */}
        {/* <Link href={`/features`}>Features</Link> */}
        {/* </MobileNavigationItem> */}

        {/* <MobileNavigationItem> */}
        {/* <Link href={`/solutions/${solutionList[0].slug}`}>Solutions</Link> */}
        {/* <Link href={`/solutions}`}>Solutions</Link> */}
        {/* </MobileNavigationItem> */}
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
      <Content {...props}>{props.children}</Content>
    </>
  );
};
