import React from "react";

import { AspectRatio, Image } from "@mantine/core";

import Wave from "./wave.svg";

export const Waves = () => (
  <AspectRatio
    ratio={1440 / 690}
    sx={{
      position: "fixed",
      bottom: 0,
      width: "100vw",
      height: "auto",
      zIndex: -1,
    }}
  >
    <Image
      src={Wave}
      alt="Waves"
      width="100vw"
      height="auto"
      sx={{
        position: "absolute",
        bottom: 0,
      }}
    />
  </AspectRatio>
  // </Box>
);
