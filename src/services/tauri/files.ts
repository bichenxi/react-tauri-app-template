import { invoke } from "@tauri-apps/api/core";

// 定义接口类型，保证类型安全
export interface FileService {
  getHomeDir: () => Promise<string>;
  listFiles: (path: string) => Promise<string[]>;
  createFile: (path: string, content: string) => Promise<string>;
  readFile: (path: string) => Promise<string>;
  deleteFile: (path: string) => Promise<string>;
}

export const fileService: FileService = {
  getHomeDir: async () => {
    return await invoke<string>("get_home_dir");
  },
  listFiles: async (path: string) => {
    return await invoke<string[]>("list_files", { path });
  },
  createFile: async (path: string, content: string) => {
    return await invoke<string>("create_file", { path, content });
  },
  readFile: async (path: string) => {
    return await invoke<string>("read_file", { path });
  },
  deleteFile: async (path: string) => {
    return await invoke<string>("delete_file", { path });
  },
};
