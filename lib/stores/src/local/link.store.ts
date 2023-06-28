import { ref } from "valtio";

import { LinkCreateSchema } from "@lib/schema-validator";
import { LinkModel } from "@lib/shared";

import { PersistProxy, persistLocalState, persistState } from "../middleware";
import { BaseRootState } from "../core";

export class LinkStore implements PersistProxy {
  public readonly rootStore: BaseRootState;
  public link_history: LinkModel[] = [];
  public session_id: string | null = null;
  public created_link: LinkModel | null = null;

  isPersisting = false;
  isHydrating = false;
  isHydrated = false;

  constructor(rootStore: BaseRootState, public readonly name = "link") {
    this.rootStore = ref(rootStore);
    persistLocalState(this, ["link_history", "created_link"]);
    persistState(this, ["session_id"]);
  }

  async createLink(payload: LinkCreateSchema) {
    const response = await this.rootStore.api.post<LinkModel, LinkCreateSchema>(
      `link`,
      { body: payload },
    );
    if (!response.ok) return response;
    this.link_history.push(response.data);
    this.created_link = response.data;
    return response;
  }

  removeLink(slug: string) {
    this.link_history = this.link_history.filter(
      (value) => !(value.slug === slug),
    );
  }

  async fetchLink(slug: string) {
    const response = await this.rootStore.api.get<LinkModel>(`r/${slug}`, {
      headers: {
        "Session-Id": this.session_id ?? "",
        Referer: this.rootStore.referer ?? document.location.hostname,
      },
    });
    if (!response.ok) return response;
    return response;
  }

  openLink(link: string) {
    if (!(typeof window === "undefined")) window.location.href = link;
  }

  public async reset() {
    this.link_history = [];
  }
}
