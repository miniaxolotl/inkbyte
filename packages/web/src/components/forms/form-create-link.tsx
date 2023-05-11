import React from "react";

import {
  Box,
  BoxProps,
  Button,
  Checkbox,
  Select,
  SelectProps,
  TextInput,
  TextInputProps,
} from "@mantine/core";
import { FiSettings } from "react-icons/fi/index.js";

export type FormCreateLinkProps = BoxProps & {
  children?: React.ReactNode;
  links: string[];
};

export const FormCreateLink = ({ links = [], sx }: FormCreateLinkProps) => {
  return (
    <Box
      sx={{
        ...sx,
        width: "100%",
        maxWidth: 680,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        "@media (max-width: 980px)": {
          maxWidth: 480,
        },
      }}
    >
      <Box>
        <ITextInput placeholder="shorten a url" />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <FiSettings />
        <Box sx={{ "::after": { content: '"Link Customization"' } }} />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          "@media (max-width: 680px)": {
            flexDirection: "column",
          },
        }}
      >
        <ISelectInput
          data={links}
          defaultValue={links[0]}
          sx={{ flex: 2, minWidth: 144 }}
        />
        <ITextInput placeholder="custom alias (optional)" sx={{ flex: 3 }} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox
          label="Enable Analytics"
          sx={{ flex: 1 }}
          color="brand-peach"
          defaultChecked={false}
        />
      </Box>
      <Button sx={{}} color="brand-peach" fullWidth>
        CREATE LINK
      </Button>
    </Box>
  );
};

const ITextInput = (props: TextInputProps) => (
  <TextInput
    {...props}
    size="xs"
    sx={{
      ...props.sx,
      input: {
        borderRadius: "0",
        padding: "4px 16px",
        fontSize: 12,
      },
      ":first-of-type": { input: { borderRadius: "4px 0px 0px 4px" } },
      ":last-of-type": { input: { borderRadius: "0px 4px 4px 0px" } },
      ":only-of-type": { input: { borderRadius: "4px" } },
    }}
  />
);

const ISelectInput = (props: SelectProps) => (
  <Select
    {...props}
    size="xs"
    sx={{
      ...props.sx,
      fontSize: 12,
      "&[data-selected]": {
        "&, &:hover": {
          backgroundColor: "brand-red",
          color: "red",
        },
      },
      ".mantine-Select-itemsWrapper": {
        padding: 2,
      },
      ".mantine-Select-item": {
        // margin: 2,
      },
      ":first-of-type": { input: { borderRadius: "4px 0px 0px 4px" } },
      ":last-of-type": { input: { borderRadius: "0px 4px 4px 0px" } },
    }}
    radius={0}
  />
);
