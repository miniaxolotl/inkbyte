import React from "react";

import { Box, Button, Checkbox } from "@mantine/core";
import { FiLock, FiMail } from "react-icons/fi/index.js";

import { InputGroup, useHookForm } from "@lib/hook-form";
import { UserCreateSchema, userCreateSchema } from "@lib/schema-validator";

import { Link } from "@components/core";

export const FormCreateAccount = () => {
  const handleSubmit = async () => {
    console.log("submit form!");
  };

  const { HookForm, InputComponent } = useHookForm<UserCreateSchema>({
    schema: userCreateSchema,
    handleSubmit,
  });

  return (
    <HookForm>
      {({ register, link }) => {
        return (
          <>
            <InputGroup direction="horizontal">
              <InputComponent
                {...register("first_name")}
                autoComplete="given-name"
                showError
              />
              <InputComponent
                {...register("last_name")}
                autoComplete="family-name"
                showError
              />
            </InputGroup>

            <InputComponent
              {...register("email")}
              icon={<FiMail />}
              autoComplete="username"
              showError
            />

            <InputGroup>
              <InputComponent
                {...register("password")}
                type="password"
                icon={<FiLock />}
                autoComplete="new-password"
                showError
              />
              <InputComponent
                {...register("confirm_password")}
                type="password"
                icon={<FiLock />}
                autoComplete="new-password"
                showError
              />
            </InputGroup>

            <InputGroup direction="horizontal" noWrap>
              <Checkbox
                {...link("marketing_opt_out")}
                label="Remember me"
                size="xs"
                sx={{ flex: 1, label: { color: "#8c4526" } }}
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
              Create Account
            </Button>
          </>
        );
      }}
    </HookForm>
  );
};
