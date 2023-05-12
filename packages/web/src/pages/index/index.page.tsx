import React from "react";

import { Center, Container, Image } from "@mantine/core";

import { DomainList } from "@lib/shared";

import { FormCreateLink } from "@components/forms";
import { LayoutDefault } from "@components/layout";
import { Link } from "@components/core";

// eslint-disable-next-line @typescript-eslint/ban-types
type PageProps = {};

// eslint-disable-next-line no-empty-pattern
export const Page = ({}: PageProps) => {
  return (
    <>
      <Container>
        <Center>
          <Link href="/">
            <Image
              src="/assets/logo/default.svg"
              alt="Logo"
              height={112}
              width={112}
              sx={{ padding: 16 }}
            />
          </Link>
        </Center>
        <Center>
          <FormCreateLink links={DomainList} />
        </Center>
      </Container>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => {
  return <LayoutDefault>{page}</LayoutDefault>;
};
