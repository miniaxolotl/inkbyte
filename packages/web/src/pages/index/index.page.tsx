import React, { useRef } from "react";

import {
  Box,
  Button,
  Collapse,
  Container,
  Image,
  Paper,
  Text,
} from "@mantine/core";

import { DomainList } from "@lib/shared";
import { featureList } from "@lib/data";

import { BaseList, FeatureListItem } from "@components/display";
import { FormCreateLink } from "@components/forms";
import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

import { useDisclosure } from "@mantine/hooks";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {};

// eslint-disable-next-line no-empty-pattern
export const Page = ({}: PageProps) => {
  const detailsPanelRef = useRef<HTMLDivElement>(null);
  const [isDetailsPanelOpen, { toggle: toggleDetailsPanel }] =
    useDisclosure(false);

  return (
    <>
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 72,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            "@media (max-width: 680px)": {
              maxWidth: 480,
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Link href="/">
              <Image
                src="/assets/logo/default.svg"
                alt="Logo"
                height={172}
                width={172}
                sx={{ padding: 16 }}
              />
            </Link>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: 680,
              gap: 12,
            }}
          >
            <Paper shadow="md" p="md" sx={{ flexGrow: 1 }} withBorder>
              <FormCreateLink links={DomainList} />
            </Paper>

            <Paper
              shadow="md"
              p="md"
              sx={{
                display: "flex",
                flexDirection: "column",
                borderWidth: 2,
                gap: 4,
              }}
              withBorder
            >
              <Text size="sm" align="center">
                <em>
                  InkByte is a URL shortener, QR code generator, and link
                  management platform all in one place.
                </em>
              </Text>
              <span id="details" ref={detailsPanelRef} />
              <Button size="xs" onClick={() => toggleDetailsPanel()}>
                {isDetailsPanelOpen ? "CLOSE DETAILS" : "LEARN MORE"}
              </Button>
            </Paper>
          </Box>
        </Box>

        <Collapse
          in={isDetailsPanelOpen}
          onTransitionEnd={() =>
            isDetailsPanelOpen
              ? detailsPanelRef.current?.scrollIntoView()
              : (window.scrollX = 0)
          }
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}
          >
            <BaseList
              items={featureList}
              id_key="title"
              item_type={FeatureListItem}
            />
          </Box>
        </Collapse>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
