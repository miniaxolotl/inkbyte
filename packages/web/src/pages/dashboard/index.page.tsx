import React, { useId } from "react";

import { Box, Container, List, Paper, Text, Title } from "@mantine/core";

import { featureList } from "@lib/data";

import { FiAnchor, FiBarChart2, FiLink2 } from "react-icons/fi";
import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {};

// eslint-disable-next-line no-empty-pattern
export const Page = ({}: PageProps) => {
  const id1 = useId();
  const id2 = useId();
  const sum1 = id1.split("").reduce((acc, cur) => acc + cur.charCodeAt(0), 0);
  const sum2 = id2.split("").reduce((acc, cur) => acc + cur.charCodeAt(0), 0);
  const sum = sum1 + sum2;

  return (
    <>
      <Container>
        <Title size="h1" order={1} color="brand-blue">
          Dashboard
        </Title>
        <Box
          sx={{
            display: "flex",
            gap: 24,
            "@media (max-width: 680px)": {
              flexDirection: "column",
            },
          }}
        >
          <Paper
            shadow="md"
            p="lg"
            sx={{
              flex: 1,
              maxWidth: "max-content",
              "@media (max-width: 680px)": {
                maxWidth: "unset",
              },
            }}
            withBorder
          >
            <List sx={{ listStyleType: "none" }}>
              <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
                <Link href={`/dashboard`}>Overview</Link>
              </List.Item>

              {featureList.map(({ slug, title }) => (
                <List.Item
                  key={slug}
                  sx={{ fontFamily: "'Secular One', sans-serif" }}
                >
                  {/* <Title size="h3" order={3} color="brand-green"> */}
                  <Link href={`/dashboard/${slug}`}>{title}</Link>
                  {/* </Title> */}
                </List.Item>
              ))}

              {/* <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
                <Link href={`/dashboard/subscription`} isDisabled>
                  Subscription
                </Link>
              </List.Item> */}
            </List>
          </Paper>

          <Paper
            shadow="md"
            p="md"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              flex: 1,
              flexGrow: 1,
            }}
            withBorder
          >
            <Title size="h2" order={2} color="brand-blue">
              Welcome to your dashboard $user
              {/* TODO */}
            </Title>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Box>
                {/* <Title size="h3" order={3} color="brand-red">
                  Top Links
                </Title> */}
                <Paper p="sm" withBorder>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 16,
                      "@media (max-width: 980px)": {
                        ".icon-display": {
                          minWidth: "calc(50% - 16px)",
                        },
                      },
                      "@media (max-width: 680px)": {
                        ".icon-display": {
                          minWidth: "100%",
                        },
                      },
                      ".icon-display": {
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        gap: 0,
                        div: {
                          whiteSpace: "nowrap",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 2,
                        },
                      },
                    }}
                  >
                    <Paper p="xs" className="icon-display" withBorder>
                      <Box>
                        <FiLink2 size={14} />
                        <Text size={14}>Links Created</Text>
                      </Box>
                      <Text size={16} weight={600}>
                        {"9,999"}
                      </Text>
                    </Paper>
                    <Paper p="xs" className="icon-display" withBorder>
                      <Box>
                        <FiBarChart2 size={14} />
                        <Text size={14}>Total Clicks</Text>
                      </Box>
                      <Text size={16} weight={600}>
                        {"9,999"}
                      </Text>
                    </Paper>
                    <Paper p="xs" className="icon-display" withBorder>
                      <Box>
                        <FiAnchor size={14} />
                        <Text size={14}>Unique Clicks</Text>
                      </Box>
                      <Text size={16} weight={600}>
                        {"9,999"}
                      </Text>
                    </Paper>
                    <Paper p="xs" className="icon-display" withBorder>
                      <Box>
                        <FiAnchor size={14} />
                        <Text size={14}>Organic Clicks</Text>
                      </Box>
                      <Text size={16} weight={600}>
                        {"9,999"}
                      </Text>
                    </Paper>
                  </Box>
                </Paper>
              </Box>

              <Box>
                <Title size="h3" order={3} color="brand-red">
                  Top Links
                </Title>
                <Paper p="sm" withBorder>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Box sx={{ display: "flex", gap: 16 }}>
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"#"` },
                        }}
                      />
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"Link"` },
                        }}
                      />
                    </Box>
                    <Text
                      size="xl"
                      weight={600}
                      sx={{
                        fontFamily: "'Secular One', sans-serif",
                        "::after": { content: `"Clicks"` },
                      }}
                    />
                  </Box>
                  {[
                    "example.com",
                    "example2.com",
                    "example3.com",
                    "example4.com",
                  ].map((link, index) => (
                    <Box
                      key={link}
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Box sx={{ display: "flex", gap: 16 }}>
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                          sx={{ "::after": { content: `"${index + 1}"` } }}
                        />
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                        >
                          <Link href={`/dashboard/link-shortener/${link}`}>
                            {link}
                          </Link>
                        </Text>
                      </Box>
                      <Box>
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                          sx={{
                            "::after": {
                              content: `"${(
                                (sum * 4) /
                                (index + 1)
                              ).toFixed()}"`,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Box>

              <Box>
                <Title size="h3" order={3} color="brand-red">
                  Top Referrers
                </Title>
                <Paper p="sm" withBorder>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Box sx={{ display: "flex", gap: 16 }}>
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"#"` },
                        }}
                      />
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"Link"` },
                        }}
                      />
                    </Box>
                    <Text
                      size="xl"
                      weight={600}
                      sx={{
                        fontFamily: "'Secular One', sans-serif",
                        "::after": { content: `"Clicks"` },
                      }}
                    />
                  </Box>
                  {[
                    "referer.com",
                    "referer2.com",
                    "referer3.com",
                    "referer4.com",
                  ].map((link, index) => (
                    <Box
                      key={link}
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Box sx={{ display: "flex", gap: 16 }}>
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                          sx={{ "::after": { content: `"${index + 1}"` } }}
                        />
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                        >
                          {/* <Link href={`/dashboard/link-shortener/${link}`}> */}
                          {link}
                          {/* </Link> */}
                        </Text>
                      </Box>
                      <Box>
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                          sx={{
                            "::after": {
                              content: `"${(
                                (sum * 2) /
                                (index + 6)
                              ).toFixed()}"`,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Box>

              <Box>
                <Title size="h3" order={3} color="brand-red">
                  Top Countries
                </Title>
                <Paper p="sm" withBorder>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Box sx={{ display: "flex", gap: 16 }}>
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"#"` },
                        }}
                      />
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"Link"` },
                        }}
                      />
                    </Box>
                    <Text
                      size="xl"
                      weight={600}
                      sx={{
                        fontFamily: "'Secular One', sans-serif",
                        "::after": { content: `"Clicks"` },
                      }}
                    />
                  </Box>
                  {["Canada", "USA", "UK", "Australia"].map((link, index) => (
                    <Box
                      key={link}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 16 }}>
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                          sx={{ "::after": { content: `"${index + 1}"` } }}
                        />
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                        >
                          {/* <Link href={`/dashboard/link-shortener/${link}`}> */}
                          {link}
                          {/* </Link> */}
                        </Text>
                      </Box>
                      <Box>
                        <Text
                          size={index ? "sm" : "xl"}
                          weight={index ? "" : 600}
                          sx={{
                            "::after": {
                              content: `"${(
                                (sum * 6) /
                                (index + 2)
                              ).toFixed()}"`,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Box>

              <Box>
                <Title size="h3" order={3} color="brand-red">
                  Top Cities
                </Title>
                <Paper p="sm" withBorder>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Box sx={{ display: "flex", gap: 16 }}>
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"#"` },
                        }}
                      />
                      <Text
                        size="xl"
                        weight={600}
                        sx={{
                          fontFamily: "'Secular One', sans-serif",
                          "::after": { content: `"Link"` },
                        }}
                      />
                    </Box>
                    <Text
                      size="xl"
                      weight={600}
                      sx={{
                        fontFamily: "'Secular One', sans-serif",
                        "::after": { content: `"Clicks"` },
                      }}
                    />
                  </Box>
                  {["Calgary", "Edmonton", "Lethbridge", "Red Deer"].map(
                    (link, index) => (
                      <Box
                        key={link}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 16 }}>
                          <Text
                            size={index ? "sm" : "xl"}
                            weight={index ? "" : 600}
                            sx={{ "::after": { content: `"${index + 1}"` } }}
                          />
                          <Text
                            size={index ? "sm" : "xl"}
                            weight={index ? "" : 600}
                          >
                            {/* <Link href={`/dashboard/link-shortener/${link}`}> */}
                            {link}
                            {/* </Link> */}
                          </Text>
                        </Box>
                        <Box>
                          <Text
                            size={index ? "sm" : "xl"}
                            weight={index ? "" : 600}
                            sx={{
                              "::after": {
                                content: `"${(
                                  (sum * 6) /
                                  (index + 2)
                                ).toFixed()}"`,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    ),
                  )}
                </Paper>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
