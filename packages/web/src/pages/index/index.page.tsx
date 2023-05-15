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
            width: "100%",
            gap: 12,
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
                height={224}
                width={224}
              />
            </Link>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              flexGrow: 1,
              maxWidth: 680,
              gap: 12,
            }}
          >
            <Paper
              shadow="md"
              p="md"
              sx={{ flexGrow: 1, width: "100%" }}
              withBorder
            >
              <FormCreateLink links={DomainList} />
            </Paper>

            <Paper
              shadow="md"
              p="md"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              withBorder
            >
              <Text
                size="sm"
                align="center"
                sx={{
                  "::after": {
                    fontSize: 12,
                    fontStyle: "italic",
                    content:
                      "'InkByte is a URL shortener, QR code generator, and link-in-bio platform all in one place.'",
                  },
                }}
              />
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
