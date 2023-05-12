import React from "react";

import { Box, Image } from "@mantine/core";

import Wave from "./wave.svg";

export const Waves = () => (
  <Box
    sx={{
      position: "fixed",
      bottom: 0,
      height: "100vh",
      width: "100vw",
      zIndex: -1,
    }}
  >
    <Image
      src={Wave}
      alt="Waves"
      sx={{
        position: "absolute",
        bottom: 0,
        width: "100vw",
      }}
    />
  </Box>
);
