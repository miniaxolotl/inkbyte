import { createServer } from "node:http";

const port = Number(process.env.FIXTURE_PORT ?? 4273);

const domains = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "inkbyte.app",
    isDefault: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "inkbyte.co",
    isDefault: false,
  },
];

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  const send = (
    status,
    body,
    headers = { "content-type": "application/json" },
  ) => {
    response.writeHead(status, headers);
    response.end(typeof body === "string" ? body : JSON.stringify(body));
  };

  if (request.method === "GET" && url.pathname === "/api/v1/domains") {
    return send(200, { success: true, data: { domains } });
  }
  if (url.pathname === "/api/v1/public/bio/fixture")
    return send(200, {
      success: true,
      data: {
        bio: {
          handle: "fixture",
          heading: "Example creator",
          bio: "A few useful links.",
          isPublished: true,
          items: [
            {
              id: "fixture-link",
              label: "Visit my website",
              url: "https://example.com",
              slug: "fixture",
              domain: "inkbyte.app",
              position: 0,
            },
          ],
        },
      },
    });

  const metadata = url.pathname.match(
    /^\/api\/v1\/public\/links\/(fixture|campaign)$/,
  );
  const link = (slug) => ({
    slug,
    domain: "inkbyte.app",
    longUrl: "https://example.com/fixture",
    cta:
      slug === "campaign"
        ? {
            heading: "A note before you go",
            body: "Visit our website.",
            action: "Continue",
          }
        : null,
  });
  if (metadata)
    return send(200, { success: true, data: { link: link(metadata[1]) } });
  const redirect = url.pathname.match(/^\/r\/([^/]+)$/);
  if (request.method === "GET" && redirect) {
    if (["fixture", "campaign"].includes(redirect[1])) {
      if (url.searchParams.get("format") === "json")
        return send(
          200,
          { success: true, data: { link: link(redirect[1]) } },
          {
            "content-type": "application/json",
            "set-cookie":
              "inkbyte_vid=fixture-cookie; Path=/; HttpOnly; SameSite=Lax",
          },
        );
      response.writeHead(302, { location: "https://example.com/fixture" });
      return response.end();
    }
    return send(404, {
      success: false,
      error: { code: "not_found", message: "Link not found" },
    });
  }

  if (request.method === "GET" && url.pathname === "/health/ready") {
    return send(200, { success: true, data: { status: "ready" } });
  }

  return send(404, {
    success: false,
    error: { code: "not_found", message: "Not found" },
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`fixture api listening on http://127.0.0.1:${port}`);
});
