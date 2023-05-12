import React from "react";

import { ServerStyles, createStylesServer } from "@mantine/ssr";
import { dangerouslySkipEscape, escapeInject } from "vite-plugin-ssr/server";
import ReactDOMServer from "react-dom/server";

import { base_config, web_config } from "@lib/config";
import { PageContextServer } from "@lib/vite-react";

import { PageShell } from "./pages";

export const passToClient = ["pageProps"];

const stylesServer = createStylesServer();

export const render = async (pageContext: PageContextServer) => {
  const {
    Page,
    pageProps,
    urlPathname,
    exports: { documentProps = {} },
  } = pageContext;

  const title = documentProps.title || base_config.app_title;
  const description = documentProps.description || base_config.app_description;

  const pageContent = ReactDOMServer.renderToString(
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>,
  );

  const styles = ReactDOMServer.renderToStaticMarkup(
    <ServerStyles html={pageContent} server={stylesServer} />,
  );

  const documentHtml = escapeInject`
		<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>${title}</title>
        <meta name="description" content="${description}" />
    		<link rel="canonical" href="https://${web_config.web_host}${urlPathname}"/>
				<link rel="manifest" href="/manifest.json">
        <link rel="icon" href="https://${web_config.host}/favicon.svg" />
				
				<!-- Open Graph / Facebook -->
				<meta property="og:type" content="website">
				<meta property="og:url" content="https://${web_config.web_host}">
				<meta property="og:title" content="${web_config.app_title}">
				<meta property="og:description" content="${web_config.app_description}">
				<meta property="og:image" content="https://${web_config.host}/logo.svg">

				<!-- Twitter -->
				<meta property="twitter:card" content="summary">
				<meta property="twitter:url" content="https://${web_config.web_host}">
				<meta property="twitter:title" content="${web_config.app_title}">
				<meta property="twitter:description" content="${web_config.app_description}">
				<meta property="twitter:image" content="https://${web_config.host}/logo.svg">

				<!-- Styles -->
				${dangerouslySkipEscape(styles)}
				<style>
					.hideUnstyled { display: none }
				</style>
				</head>
      <body>
        <div id="page-root">${dangerouslySkipEscape(pageContent)}</div>
      </body>
    </html>`;

  return {
    documentHtml,
    pageContext: async () => {
      return {};
    },
  };
};
