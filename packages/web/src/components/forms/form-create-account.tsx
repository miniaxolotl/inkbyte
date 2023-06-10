import React from "react";

import {
  Box,
  BoxProps,
  Button,
  Checkbox,
  TextInput,
  TextInputProps,
} from "@mantine/core";

import { Link } from "@components/core";

type FormRegisterProps = BoxProps & {
  children?: React.ReactNode;
};

export const FormCreateAccount = ({ sx }: FormRegisterProps) => {
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

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ITextInput placeholder="First Name" type="first_name" />
        <ITextInput placeholder="Last Name" type="last_name" />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ITextInput placeholder="Password" type="password" />
        <ITextInput placeholder="Confirm Password" type="password" />
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
        <Checkbox
          label="Email Updates"
          size="xs"
          sx={{ flex: 1 }}
          color="brand-peach"
          defaultChecked={false}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 4,
            fontSize: 12,
          }}
        >
          {/* <Link href="/login">Login</Link> */}
          {/* <Box sx={{ "::after": { content: "'/'" } }} /> */}
          <Link href="/forgot-password">Forgot Password</Link>
        </Box>
      </Box>
      <Button color="brand-green" size="xs" fullWidth>
        Create Account
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
