import React from "react";

import { Box, Button, Checkbox } from "@mantine/core";

import { InputGroup, useHookForm } from "@lib/hook-form";
import { LoginUserSchema, loginUserSchema } from "@lib/schema-validator";

import { Link } from "@components/core";

export const FormLogin = () => {
  const handleSubmit = async () => {
    console.log("submit form!");
  };

  const { HookForm, InputComponent } = useHookForm<LoginUserSchema>({
    initialState: {},
    schema: loginUserSchema,
    handleSubmit,
  });

  return (
    <HookForm>
      {({ register, link }) => {
        return (
          <>
            <InputGroup>
              <InputComponent {...register("email")} showError />
              <InputComponent
                {...register("password")}
                type="password"
                showError
              />
            </InputGroup>

            <InputGroup direction="horizontal">
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
            </InputGroup>

            <Button type="submit" color="brand-green" size="xs" fullWidth>
              Login
            </Button>
          </>
        );
      }}
    </HookForm>
  );
};
