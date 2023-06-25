import { useEffect } from "react";

export const useMount = (method: () => void) => {
  return useEffect(method, [method]);
};

export const useUnMount = (method: () => void) => {
  return useEffect(() => method, [method]);
};
