import React from "react";

import { Button } from "@mantine/core";

import { ResetUserSchema, loginUserSchema } from "@lib/schema-validator";
import { useHookForm } from "@lib/hook-form";

export const FormForgotPassword = () => {
  const handleSubmit = async () => {
    console.log("submit form!");
  };

  const { HookForm, InputComponent } = useHookForm<ResetUserSchema>({
    initialState: {},
    schema: loginUserSchema,
    handleSubmit,
  });

  return (
    <HookForm>
      {({ register }) => {
        return (
          <>
            <InputComponent {...register("email")} showError />

            <Button type="submit" color="brand-red" size="xs" fullWidth>
              Reset Password
            </Button>
          </>
        );
      }}
    </HookForm>
  );
};
