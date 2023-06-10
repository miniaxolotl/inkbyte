import { ReactNode, Ref, forwardRef } from "react";

import {
  Container as MantineContainer,
  ContainerProps as MantineContainerProps,
} from "@mantine/core";

export type ContainerProps = Partial<MantineContainerProps> & {
  children?: ReactNode;
};

const ContainerComponent = (
  props: ContainerProps,
  ref: Ref<HTMLDivElement>,
) => (
  <MantineContainer ref={ref} {...props}>
    {props.children}
  </MantineContainer>
);

export const Container = forwardRef(ContainerComponent);
