import React from "react";

import {
  BoxProps,
  Button,
  Select,
  SelectProps,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  FiAtSign,
  FiClock,
  FiMapPin,
  FiSettings,
} from "react-icons/fi/index.js";

import { InputGroup, useHookForm } from "@lib/hook-form";
import { LinkCreateSchema, linkCreateSchema } from "@lib/schema-validator";
import { Box } from "@lib/components";

export type FormCreateLinkProps = BoxProps & {
  children?: React.ReactNode;
  links: string[];
};

export const FormCreateLink = ({ links = [] }: FormCreateLinkProps) => {
  const handleSubmit = async () => {
    console.log("submit form!");
  };

  const { HookForm, InputComponent } = useHookForm<LinkCreateSchema>({
    initialState: {},
    schema: linkCreateSchema,
    handleSubmit,
  });

  const theme = useMantineTheme();

  return (
    <HookForm>
      {({ register, link }) => {
        return (
          <>
            <InputComponent
              {...register("long_url")}
              label="Shorten a URL"
              icon={<FiAtSign />}
              showError
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiSettings />
              <Box
                sx={{
                  "::after": {
                    content: '"Link Customization"',
                  },
                }}
              />
            </Box>

            <InputGroup direction="horizontal">
              <SelectComponent
                {...link("domain")}
                icon={<FiMapPin />}
                data={links}
                defaultValue={links[0]}
                sx={{ flex: 2 / 3, minWidth: 144 }}
              />
              <InputComponent
                {...register("custom_slug")}
                label="Custom Alias (Optional)"
                sx={{
                  flex: 3,
                  '[value=""]': {
                    ":not(:focus)": {
                      backgroundColor: theme.colors.gray[3],
                    },
                  },
                }}
              />
            </InputGroup>

            <InputGroup direction="horizontal" gap={12} noWrap>
              <Tooltip
                transitionProps={{ transition: "pop" }}
                label="View History"
              >
                <Button
                  color="brand-peach"
                  size="xs"
                  aria-label="View History Button"
                  sx={{ minWidth: 48 }}
                >
                  <FiClock />
                </Button>
              </Tooltip>
              <Button type="submit" color="brand-green" size="xs" fullWidth>
                Login
              </Button>
            </InputGroup>
          </>
        );
      }}
    </HookForm>
  );
};

const SelectComponent = (props: SelectProps) => (
  <Select
    {...props}
    size="xs"
    sx={{
      ...props.sx,
      fontSize: 14,
      "&[data-selected]": {
        "&, &:hover": {
          backgroundColor: "brand-red",
          color: "red",
        },
      },
      ".mantine-Select-input": {
        "@media (max-width: 680px)": {
          height: 48,
        },
      },
      ".mantine-Select-itemsWrapper": {
        padding: 2,
      },
      ".mantine-Select-item": {
        // margin: 2,
      },
      ":first-of-type": {
        input: {
          borderRadius: "4px 0px 0px 4px",
          "@media (max-width: 680px)": {
            borderRadius: "4px 4px 0px 0px",
          },
        },
      },
      ":last-of-type": {
        input: {
          borderRadius: "0px 4px 4px 0px",
          "@media (max-width: 680px)": {
            borderRadius: "0px 0px 4px 4px",
          },
        },
      },
    }}
    radius={0}
  />
);
