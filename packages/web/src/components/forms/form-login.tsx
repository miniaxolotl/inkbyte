import React from "react";

import { Box, Button, Checkbox } from "@mantine/core";
import { FiLock, FiMail } from "react-icons/fi/index.js";

import { HookFormState, InputGroup, useHookForm } from "@lib/hook-form";
import { UserLoginSchema, userLoginSchema } from "@lib/schema-validator";
import { uuid } from "@lib/utility";

import { Link } from "@components/core";
import { useStore } from "@stores/StoreProvider";

export const FormLogin = () => {
  const { session, account, toast } = useStore();

  const handleSubmit = async (
    payload: UserLoginSchema,
    helper: HookFormState<UserLoginSchema>,
  ) => {
    const response = await session.login(payload);
    if (!response.ok) {
      helper.setSubmitError({
        heading: `Error ${response.status}`,
        content: response.data ?? response.error,
      });
    } else {
      const toastId = uuid();
      toast.createToast({
        id: toastId,
        heading: "Login Successful",
        content: `Welcome Back ${account.account_data?.first_name}!`,
      });
    }
  };

  const { HookForm, InputComponent } = useHookForm<UserLoginSchema>({
    schema: userLoginSchema,
    handleSubmit,
  });

  return (
    <HookForm withError>
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

            <InputGroup direction="horizontal" noWrap>
              <Checkbox
                {...link("remember_me")}
                label="Remember me"
                size="xs"
                sx={{ flex: 1 }}
                color="brand-peach"
                defaultChecked={false}
              />

              <Box
                sx={{
                  display: "flex",
                  placeContent: "flex-end",
                  flex: 1,
                  fontSize: 12,
                }}
              >
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
