import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../infra/env/env";
import type { GeneratePresignedUrlParams, IS3Service } from "./s3.interface";

export class S3PublicService implements IS3Service {
  private readonly bucketName: string;
  private readonly region: string;

  constructor(
    private readonly s3Client: S3Client,
    bucketName: string,
    region: string
  ) {
    this.bucketName = bucketName;
    this.region = region;
  }

  async generatePresignedUrl(params: GeneratePresignedUrlParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
      ContentType: params.contentType,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: params.expireInSeconds,
    });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);
    return response.Contents?.map((item) => item.Key!).filter(Boolean) ?? [];
  }

  getPublicUrl(key: string): string {
    return `${env.CLOUDFRONT_URL}/${key}`;
  }

  static getInstance(): S3PublicService {
    return new S3PublicService(
      new S3Client({ region: env.AWS_REGION }),
      env.S3_PUBLIC_BUCKET_NAME,
      env.AWS_REGION,
    );
  }
}
