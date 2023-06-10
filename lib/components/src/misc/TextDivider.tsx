import _ from "lodash";

import { Box, BoxProps, Divider, Text } from "@mantine/core";

type TextDividerProps = Omit<BoxProps, "children"> & {
  href?: string;
  children?: string;
};

export const TextDivider = (props: TextDividerProps) => {
  return (
    <Box
      {..._.omit(props, ["size"])}
      sx={{
        display: "flex",
        alignItems: "center",
        padding: "16px 8px",
        margin: "auto",
        ...props.sx,
      }}
    >
      <Divider sx={{ flex: 1 }} />
      <Text
        weight={600}
        color="brand-peach"
        sx={{
          flex: 0,
          padding: "0 12px",
          fontFamily: "'Secular One', sans-serif",
          "::after": {
            content: `'${props.children ?? "OR"}'`,
          },
        }}
      >
        {/* {props.children} */}
      </Text>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
};
