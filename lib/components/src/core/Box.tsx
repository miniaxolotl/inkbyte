import React, { ReactNode, Ref, forwardRef } from "react";

import { Box as MantineBox, BoxProps as MantineBoxProps } from "@mantine/core";

export type BoxProps = Partial<MantineBoxProps> & {
  children?: ReactNode;
};

const BoxComponent = (props: BoxProps, ref: Ref<HTMLDivElement>) => (
  <MantineBox ref={ref} {...props}>
    {props.children}
  </MantineBox>
);

export const Box = forwardRef(BoxComponent);
