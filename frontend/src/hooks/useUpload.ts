import { useMutation } from "@tanstack/react-query";
import { startUpload } from "../services/api";
import { Platform } from "../types";

interface UploadParams {
  video: File;
  title: string;
  description: string;
  tags: string[];
  platforms: Platform[];
}

export function useUpload() {
  return useMutation({
    mutationFn: async (params: UploadParams) => {
      const fd = new FormData();
      fd.append("video", params.video);
      fd.append("title", params.title);
      fd.append("description", params.description);
      fd.append("tags", JSON.stringify(params.tags));
      fd.append("platforms", JSON.stringify(params.platforms));
      return startUpload(fd);
    },
  });
}
