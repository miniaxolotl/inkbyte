import React, { ReactNode, Ref, forwardRef } from "react";

import {
  Button as MantineButton,
  ButtonProps as MantineButtonProps,
} from "@mantine/core";

export type ButtonProps = MantineButtonProps & {
  children?: ReactNode;
};

const ButtonComponent = (props: ButtonProps, ref: Ref<HTMLButtonElement>) => (
  <MantineButton ref={ref} {...props}>
    {props.children}
  </MantineButton>
);

export const Button = forwardRef(ButtonComponent);
