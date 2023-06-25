import { ref } from "valtio";

import { LinkCreateSchema } from "@lib/schema-validator";
import { LinkModel } from "@lib/shared";

import { PersistProxy, persistState } from "../middleware";
import { BaseRootState } from "../core";

export class LinkStore implements PersistProxy {
  public readonly rootStore: BaseRootState;
  public data: LinkModel[] = [];
  public created_link: LinkModel | null = null;

  isPersisting = false;
  isHydrating = false;
  isHydrated = false;

  constructor(rootStore: BaseRootState, public readonly name = "link") {
    this.rootStore = ref(rootStore);
    persistState(this, ["data"], rootStore.cookies);
  }

  async createLink(payload: LinkCreateSchema) {
    const response = await this.rootStore.api.post<LinkModel, LinkCreateSchema>(
      `link`,
      { body: payload },
    );
    if (!response.ok) return response;
    this.data.push(response.data);
    this.created_link = response.data;
    return response;
  }

  removeLink(slug: string) {
    this.data = this.data.filter((value) => !(value.slug === slug));
  }

  async fetchLink(slug: string) {
    const response = await this.rootStore.api.get<LinkModel>(`link/${slug}`);
    if (!response.ok) return response;
    return response;
  }

  openLink(link: string) {
    if (!(typeof window === "undefined")) window.location.href = link;
  }

  public async reset() {
    this.data = [];
  }
}
