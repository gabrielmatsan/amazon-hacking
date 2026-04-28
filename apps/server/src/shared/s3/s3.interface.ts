export interface GeneratePresignedUrlParams {
  key: string;
  contentType: string;
  expireInSeconds: number;
}

export interface IS3Service {
  generatePresignedUrl(params: GeneratePresignedUrlParams): Promise<string>;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
  listFiles(prefix: string): Promise<string[]>;
  getPublicUrl(key: string): string;
}

export interface IS3File {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
}
