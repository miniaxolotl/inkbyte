import React from "react";

import { Box, BoxProps, Button, Checkbox } from "@mantine/core";

import { LoginUserSchema, loginUserSchema } from "@lib/schema-validator";
import { useHookForm } from "@lib/hook-form";

import { Link } from "@components/core";

type FormLoginProps = BoxProps & {
  children?: React.ReactNode;
};

export const FormLogin = ({ sx }: FormLoginProps) => {
  // const handleSubmit = async (values: LoginUserSchema) => {
  const handleSubmit = async () => {
    console.log("submit form!");
  };

  const { HookForm, InputComponent } = useHookForm<LoginUserSchema>({
    initialState: {},
    schema: loginUserSchema,
    handleSubmit,
  });

  return (
    <Box
      sx={{
        ...sx,
        width: "100%",
        maxWidth: 680,
        "@media (max-width: 980px)": {
          maxWidth: 480,
        },
        form: {
          display: "flex",
          flexDirection: "column",
          gap: 16,
        },
        ".base-input-container": {
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
        },
      }}
    >
      <HookForm>
        {({ register, link }) => {
          return (
            <>
              <Box>
                <InputComponent {...register("email")} showLabel={false} />
                <InputComponent {...register("password")} type="password" />
              </Box>

              <Checkbox
                {...link("remember_me")}
                label="Remember me"
                size="xs"
                sx={{ flex: 1 }}
                color="brand-peach"
                defaultChecked={false}
              />

              <Box sx={{ fontSize: 12 }}>
                <Link href="/forgot-password">Forgot Password</Link>
              </Box>

              <Button type="submit" color="brand-green" size="xs" fullWidth>
                Login
              </Button>
            </>
          );
        }}
      </HookForm>
    </Box>
  );
};
