import { useEffect } from "react";

export const useAsyncMount = (method: () => Promise<void>) => {
  return useEffect(() => {
    method();
  }, [method]);
};

export const useMount = (method: () => void) => {
  return useEffect(() => {
    method();
  }, [method]);
};

export const useUnMount = (method: () => void) => {
  return useEffect(() => method, [method]);
};
