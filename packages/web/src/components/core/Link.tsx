import React from "react";

import { Anchor, AnchorProps, Box, CSSObject } from "@mantine/core";
import _ from "lodash";

import { usePageContext } from "@renderer/hooks";

type LinkProps = AnchorProps & {
  href?: string;
  className?: string;
  children?: React.ReactNode;
  isDisabled?: boolean;
};

export const Link = (props: LinkProps) => {
  const pageContext = usePageContext();
  const isActive = pageContext.urlPathname === props.href;
  const isDisabled = !!props.isDisabled;
  const Component = props.href ? Anchor : Box;
  return (
    <Component
      {..._.omit(props, ["isDisabled"])}
      {...(props.href ? { href: props.href } : {})}
      // href={isDisabled ? undefined : props.href}
      weight={600}
      sx={(theme) => ({
        color: isDisabled
          ? theme.colors["gray"][6]
          : isActive
          ? theme.colors["brand-red"][4]
          : theme.colors["brand-green"][6],
        fontFamily: "inherit",
        "&:hover": {
          color: isDisabled
            ? theme.colors["gray"][4]
            : theme.colors["brand-cerulean"][4],
          textDecoration: "none",
          cursor: isDisabled ? "not-allowed" : "pointer",
        },
        ...(props.sx as CSSObject),
      })}
    >
      {props.children}
    </Component>
  );
};
