import React, { ReactNode } from "react";

import { Box } from "@lib/components";

export type InputGroupProps = {
  children: ReactNode;
  direction?: "horizontal" | "vertical";
  gap?: number;
  noWrap?: boolean;
};

export const InputGroup = ({
  children,
  direction = "vertical",
  gap = 0,
  noWrap,
}: InputGroupProps) => {
  const groupStyle =
    direction === "vertical"
      ? {
          ":first-of-type": {
            input: {
              borderRadius: "4px 4px 0px 0px",
              "@media (max-width: 680px)": {
                borderRadius: "4px 4px 0px 0px",
              },
            },
          },
          ":last-of-type": {
            input: {
              borderRadius: "0px 0px 4px 4px",
              "@media (max-width: 680px)": {
                borderRadius: "0px 0px 4px 4px",
              },
            },
          },
          ":only-of-type": { input: { borderRadius: "4px" } },
        }
      : {
          ":first-of-type": {
            input: {
              borderRadius: "4px 0px 0px 4px",
              "@media (max-width: 680px)": {
                borderRadius: "4px 4px 0px 0px",
              },
            },
          },
          ":last-of-type": {
            input: {
              borderRadius: "0px 4px 4px 0px",
              "@media (max-width: 680px)": {
                borderRadius: "0px 0px 4px 4px",
              },
            },
          },
          ":only-of-type": { input: { borderRadius: "4px" } },
        };

  return (
    <Box
      sx={{
        display: "flex",
        gap,
        flexDirection: direction === "vertical" ? "column" : "row",
        justifyContent: "space-between",
        alignContent: "space-between",
        "@media (max-width: 680px)": noWrap
          ? {}
          : {
              flexDirection: "column",
            },
        ".base-input-container": {
          flex: 1,
          ...groupStyle,
          input: {
            borderRadius: 0,
          },
        },
      }}
    >
      {children}
    </Box>
  );
};
