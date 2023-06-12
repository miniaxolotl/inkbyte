import React, { ChangeEvent } from "react";

import { BaseInput, BaseInputProps } from "./base-input";

export type InputFieldProps = {
  type?: BaseInputType;
  autoComplete?: BaseInputAutoComplete;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  value: string;
};

export type InputFieldValues = {
  [x: string]: unknown;
};

export type FormControlProps<T extends InputFieldValues> = Omit<
  BaseInputProps,
  "name" | "type"
> & {
  name: keyof T;
  type?: BaseInputType;
  autoComplete?: BaseInputAutoComplete;
};

export const FormControl = <T extends InputFieldValues>(
  props: FormControlProps<T>,
) => {
  const { type = "text" } = props;
  if (type === "password") {
    return <BaseInput {...props} type="password" name={props.name as string} />;
  }
  return <BaseInput {...props} name={props.name as string} />;
};
