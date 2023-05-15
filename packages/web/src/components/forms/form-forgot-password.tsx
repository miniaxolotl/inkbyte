import React from "react";

import {
  Box,
  BoxProps,
  Button,
  TextInput,
  TextInputProps,
} from "@mantine/core";

type FormForgotPasswordProps = BoxProps & {
  children?: React.ReactNode;
};

export const FormForgotPassword = ({ sx }: FormForgotPasswordProps) => {
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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ITextInput placeholder="email" />
      </Box>

      <Button color="brand-red" size="xs" fullWidth>
        Reset Password
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
      flex: 1,
      input: {
        borderRadius: "0",
        padding: "4px 16px",
        fontSize: 12,
      },
      ":first-of-type": {
        input: {
          // borderRadius: "4px 0px 0px 4px",
          borderRadius: "4px 4px 0px 0px",
          "@media (max-width: 680px)": {
            borderRadius: "4px 4px 0px 0px",
          },
        },
      },
      ":last-of-type": {
        input: {
          // borderRadius: "0px 4px 4px 0px",
          borderRadius: "0px 0px 4px 4px",
          "@media (max-width: 680px)": {
            borderRadius: "0px 0px 4px 4px",
          },
        },
      },
      ":only-of-type": { input: { borderRadius: "4px" } },
    }}
  />
);
