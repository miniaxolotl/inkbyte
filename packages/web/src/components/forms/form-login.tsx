import React from "react";

import { Box, Button, Checkbox } from "@mantine/core";
import { FiLock, FiMail } from "react-icons/fi/index.js";

import { HookFormState, InputGroup, useHookForm } from "@lib/hook-form";
import { UserLoginSchema, userLoginSchema } from "@lib/schema-validator";

import { Link } from "@components/core";
import { useStore } from "@stores";

export const FormLogin = () => {
  const { session } = useStore();

  const handleSubmit = async (
    payload: UserLoginSchema,
    h: HookFormState<UserLoginSchema>,
  ) => {
    const response = await session.createSession(payload);
    if (!response.ok) {
      h.setSubmitError({
        heading: `Error ${response.status}`,
        content: response.error,
      });
    }
  };

  const { HookForm, InputComponent } = useHookForm<UserLoginSchema>({
    schema: userLoginSchema,
    handleSubmit,
  });

  return (
    <HookForm>
      {({ register, link }) => {
        return (
          <>
            <InputGroup>
              <InputComponent
                {...register("email")}
                icon={<FiMail />}
                autoComplete="username"
                showError
              />
              <InputComponent
                {...register("password")}
                type="password"
                icon={<FiLock />}
                autoComplete="current-password"
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
