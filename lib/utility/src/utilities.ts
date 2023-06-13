import { Decimal } from "@prisma/client/runtime/library";

export type BaseMap = {
  [x: string | number]: BaseMap | BaseMap[] | Date | string | number | null;
};

export type BaseMapKeys<T extends BaseMap> = keyof T;

export const exclude = (
  payload: BaseMap | BaseMap[],
  { keys = [], like = [] }: { keys?: string[]; like?: string[] } = {
    keys: [],
    like: [],
  },
) => {
  const reduce = (payload: BaseMap | BaseMap[]): BaseMap | BaseMap[] => {
    if (typeof payload === "string") return payload;
    if (typeof payload === "number") return payload;
    // !scuffed
    if (typeof payload === "bigint")
      return Number(payload) as unknown as BaseMap;
    if (typeof payload === "object") {
      // !scuffed
      if ((payload as unknown as Decimal).toNumber)
        return (payload as unknown as Decimal).toNumber() as unknown as BaseMap;
      // !scuffed
      if ((payload as unknown as Decimal).toNumber)
        return (payload as unknown as Decimal).toNumber() as unknown as BaseMap;
      if (Array.isArray(payload)) {
        return payload.map((item): BaseMap => reduce(item) as BaseMap);
      }
      if (Object.keys(payload).length) {
        return Object.keys(payload).reduce(
          (a, key) =>
            keys.includes(key) || like.filter((v) => key.includes(v)).length
              ? a
              : payload[key]
              ? { ...a, [key]: reduce(payload[key] as BaseMap) }
              : { ...a, [key]: null },
          {} as BaseMap,
        );
      }
    }
    return payload;
  };

  return reduce(payload);
};
