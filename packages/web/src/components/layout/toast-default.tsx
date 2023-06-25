import { Alert } from "@mantine/core";
import { FiAlertCircle } from "react-icons/fi/index.js";
import React from "react";

import { Box } from "@lib/components";
import { type Toast } from "@lib/stores";
import { useStateProvider } from "@stores";

export const ToastDefault = () => {
  const { toast } = useStateProvider();

  return (
    <Box
      sx={{
        position: "absolute",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        height: "auto",
      }}
    >
      {toast.toastList.map((data) => {
        return <ToastComponent key={data.id} {...data} />;
      })}
    </Box>
  );
};

type ToastComponentProps = Toast;

const ToastComponent = ({ type, heading, content }: ToastComponentProps) => {
  return (
    <Alert
      icon={<FiAlertCircle size={24} />}
      title={heading}
      variant="filled"
      color={type === "error" ? "brand-red" : "brand-blue"}
      sx={{
        zIndex: 100,
        width: "auto",
        margin: "auto",
      }}
    >
      {content}
    </Alert>
  );
};
