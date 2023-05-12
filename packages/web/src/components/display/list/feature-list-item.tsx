import React from "react";

import { Divider, List, Paper, PaperProps, Text, Title } from "@mantine/core";
import { FiCheckCircle } from "react-icons/fi/index.js";
import type { IconType } from "react-icons/lib";
import { Link } from "@components/core";

type FeatureListItemProps = PaperProps & {
  item: {
    slug: string;
    title: string;
    description: string;
    benefits: string[];
    Icon: IconType;
  };
};

export const FeatureListItem = ({
  item: { slug, title, description, benefits, Icon },
}: FeatureListItemProps) => (
  <Paper
    shadow="md"
    p="md"
    sx={{
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
      borderWidth: 2,
      // border: "2px solid grey",
    }}
    withBorder
  >
    <Link href={`/features/${slug}`} color="unset">
      <Title
        size="h3"
        order={3}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Icon />
        {title}
      </Title>
    </Link>
    <Text size="xs" sx={{ flexGrow: 1 }}>
      {description}
    </Text>
    <Divider sx={{ margin: "16px 0" }} />
    <Title size="h3" order={4}>
      Features & Benefits
    </Title>
    <List
      sx={{
        listStyleType: "none",
        li: {
          display: "flex",
          flexDirection: "row",
        },
        "span, a": {
          display: "flex",
          alignItems: "center",
          gap: 4,
          svg: {
            stroke: "green",
          },
        },
      }}
    >
      {benefits.map((benefit) => (
        <List.Item key={benefit}>
          <FiCheckCircle size={16} />
          <Text size="sm">{benefit}</Text>
        </List.Item>
      ))}
    </List>
  </Paper>
);
