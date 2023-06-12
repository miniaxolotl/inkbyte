import { useEffect } from "react";

export const useMount = (method: () => void) => {
  return useEffect(method, [method]);
};
