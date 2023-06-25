import { BaseLink, LinkModel } from "@lib/shared";

import { PersistProxy, persistState } from "../middleware";
import { BaseRootState } from "../core";
import { ref } from "valtio";

export class LinkStore implements PersistProxy {
  public readonly rootStore: BaseRootState;
  public data: BaseLink[] | null = [];

  isPersisting = false;
  isHydrating = false;
  isHydrated = false;

  constructor(rootStore: BaseRootState, public readonly name = "link") {
    this.rootStore = ref(rootStore);
    persistState(this, ["data"], rootStore.cookies);
  }

  async fetchLink(slug: string) {
    const response = await this.rootStore.api.get<LinkModel>(`link/${slug}`);
    if (!response.ok) return null;
    return response.data;
  }

  openLink(link: string) {
    if (!(typeof window === "undefined")) window.location.href = link;
  }

  public async reset() {
    this.data = [];
  }
}
