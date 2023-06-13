import React from "react";

import { Box, Button, Checkbox } from "@mantine/core";

import { CreateUserSchema, createUserSchema } from "@lib/schema-validator";
import { InputGroup, useHookForm } from "@lib/hook-form";

import { Link } from "@components/core";

export const FormCreateAccount = () => {
  const handleSubmit = async () => {
    console.log("submit form!");
  };

  const { HookForm, InputComponent } = useHookForm<CreateUserSchema>({
    initialState: {},
    schema: createUserSchema,
    handleSubmit,
  });

  return (
    <HookForm>
      {({ register, link }) => {
        return (
          <>
            <InputGroup direction="horizontal">
              <InputComponent {...register("first_name")} />
              <InputComponent {...register("last_name")} />
            </InputGroup>

            <InputComponent {...register("email")} showLabel={false} />

            <InputGroup>
              <InputComponent {...register("password")} type="password" />
              <InputComponent
                {...register("confirm_password")}
                type="password"
              />
            </InputGroup>

            <InputGroup direction="horizontal">
              <Checkbox
                {...link("marketing_opt_out")}
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
              Create Account
            </Button>
          </>
        );
      }}
    </HookForm>
  );
};
