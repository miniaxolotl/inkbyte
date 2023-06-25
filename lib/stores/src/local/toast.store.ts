import { BaseRootState } from "../core";
import { notifications } from "@mantine/notifications";
import { ref } from "valtio";

export type Toast = {
  id: string;
  type?: "info" | "error";
  heading?: string;
  content?: string;
};

export class ToastStore {
  public readonly rootStore: BaseRootState;
  public toastList: Toast[] = [];

  constructor(rootStore: BaseRootState, public readonly name = "toast") {
    this.rootStore = ref(rootStore);
  }

  createToast(payload: Toast = { id: "" }) {
    this.toastList.push(payload);
    this.showToast(payload.id);
  }

  addToast(payload: Toast = { id: "" }) {
    this.toastList.push(payload);
  }

  showToast(id: string) {
    const toast = this.toastList.find((value) => value.id === id);
    if (toast) {
      notifications.show({
        title: toast.heading,
        message: toast.content,
        withBorder: true,
      });
    }
  }

  clearToast(id: string) {
    this.toastList = this.toastList.filter((value) => value.id != id);
  }
}
