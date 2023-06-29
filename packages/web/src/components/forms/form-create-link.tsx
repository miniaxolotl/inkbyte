import React, { useEffect, useState } from "react";

import {
  BoxProps,
  Button,
  Collapse,
  Select,
  SelectProps,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  FiAtSign,
  FiClock,
  FiMapPin,
  FiSettings,
  FiTrash,
} from "react-icons/fi/index.js";

import { BaseInput, InputGroup, useHookForm } from "@lib/hook-form";
import { LinkCreateSchema, linkCreateSchema } from "@lib/schema-validator";
import { Box } from "@lib/components";
import { uuid } from "@lib/utility";

import { useStateProvider, useStore } from "@stores";
import { LinkModel } from "@lib/shared";
import { useDisclosure } from "@mantine/hooks";
import { useMount } from "@lib/hooks";

export type FormCreateLinkProps = BoxProps & {
  children?: React.ReactNode;
  links: string[];
};

export const FormCreateLink = ({ links = [] }: FormCreateLinkProps) => {
  const { link: linkStore, toast } = useStore();
  const { link: linkState } = useStateProvider();

  const [showLinkHistory, { toggle: toggleShowLinkHistory }] =
    useDisclosure(false);
  const [linkHistory, setLinkHistory] = useState<LinkModel[]>([]);
  const [latestLink, setLatestLink] = useState<LinkModel | null>(null);

  useEffect(() => {
    setLinkHistory(linkState.link_history as LinkModel[]);
  }, [linkState.link_history]);

  useMount(() => {
    setLatestLink(linkState.created_link);
  });

  const handleSubmit = async (payload: LinkCreateSchema) => {
    const response = await linkStore.createLink(payload);
    const toastId = uuid();
    if (response.ok) {
      toast.createToast({
        id: toastId,
        heading: "Link Created",
        content: "Your link has been created.",
      });
    } else {
      toast.createToast({
        id: toastId,
        heading: "Error",
        content:
          (response.data as string) ??
          response.error ??
          "There was an error while creating your link.",
      });
    }
  };

  const LinkHistoryItem = ({ slug, long_url, domain }: LinkModel) => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          label: { fontSize: 14 },
        }}
      >
        <label>{long_url}</label>
        <Box sx={{ display: "flex", flex: 1, gap: 16 }}>
          <Tooltip
            transitionProps={{ transition: "pop" }}
            label="Click to Copy"
          >
            <BaseInput
              name={slug}
              value={`https://${domain.slug}/l/${slug}`}
              sx={{
                flex: 1,
                input: {
                  backgroundColor: theme.colors.gray[3],
                },
              }}
              handleClick={(event) => {
                const element = event.target as HTMLInputElement;
                element.select();
                navigator.clipboard.writeText(element.value);
              }}
            />
          </Tooltip>
          <Tooltip transitionProps={{ transition: "pop" }} label="Remove Item">
            <Button
              color="brand-peach"
              size="xs"
              aria-label="View History Button"
              onClick={() => linkStore.removeLink(slug)}
              sx={{ minWidth: 48 }}
            >
              <FiTrash />
            </Button>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  const { HookForm, InputComponent } = useHookForm<LinkCreateSchema>({
    initialState: { domain: links[0] },
    schema: linkCreateSchema,
    handleSubmit,
  });

  const theme = useMantineTheme();

  return (
    <HookForm>
      {({ register, link, isSubmitting, isUpdating }) => {
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

            <InputGroup direction="horizontal" gap={16} noWrap>
              <Button type="submit" color="brand-green" size="xs" fullWidth>
                Create Link
              </Button>
              <Tooltip
                transitionProps={{ transition: "pop" }}
                label="View History"
                onClick={() => toggleShowLinkHistory()}
              >
                <Button
                  color="brand-blue"
                  size="xs"
                  aria-label="View History Button"
                  sx={{ minWidth: 48 }}
                >
                  <FiClock />
                </Button>
              </Tooltip>
            </InputGroup>

            <Collapse in={!!latestLink}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Title
                  order={3}
                  size="h3"
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                  color="brand-red"
                >
                  Created Link
                </Title>
                <Box
                  sx={{
                    label: { fontSize: 14 },
                  }}
                >
                  <label>{latestLink?.long_url}</label>
                  <Tooltip
                    transitionProps={{ transition: "pop" }}
                    label="Click to Copy"
                  >
                    <BaseInput
                      name="created-link"
                      value={
                        latestLink
                          ? `https://${latestLink?.domain.slug}/l/${latestLink?.slug}`
                          : ""
                      }
                      handleClick={(event) => {
                        const element = event.target as HTMLInputElement;
                        element.select();
                        navigator.clipboard.writeText(element.value);
                      }}
                      isSubmitting={isSubmitting}
                      isUpdating={isUpdating}
                    />
                  </Tooltip>
                </Box>
              </Box>
            </Collapse>

            <Collapse in={showLinkHistory}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Title
                  order={3}
                  size="h3"
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                  color="brand-red"
                >
                  Link History
                </Title>
                {linkHistory
                  .slice()
                  .reverse()
                  .map((item) => (
                    <LinkHistoryItem key={item.slug} {...item} />
                  ))}
              </Box>
            </Collapse>
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
