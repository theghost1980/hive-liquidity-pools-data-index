export interface DownloadStatus {
  state: "idle" | "in_progress" | "completed" | "failed";
  startedAt?: string;
  finishedAt?: string;
  results?: any;
  error?: string;
  lastFileDownloaded?: string;
  lastFolderChecked?: string;
}
