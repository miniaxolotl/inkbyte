import React from "react";

import { Anchor, AnchorProps, CSSObject } from "@mantine/core";

import { usePageContext } from "@renderer/hooks";

type LinkProps = AnchorProps & {
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

export const Link = (props: LinkProps) => {
  const pageContext = usePageContext();
  const isActive = pageContext.urlPathname === props.href && "is-active";
  return (
    <Anchor
      {...props}
      weight={600}
      sx={(theme) => ({
        color: isActive ? "brand-green" : theme.colors["brand-red"][4],
        "&:hover": { textDecoration: "none" },
        ...(props.sx as CSSObject),
      })}
    >
      {props.children}
    </Anchor>
  );
};
