import { BadRequestError } from "@/shared/infra/errors/bad-error-request";
import { S3PublicService } from "@/shared/s3/s3-public.service";
import { t, type Static } from "elysia";

export const uploadImageInput = t.Object({
  fileName: t.String(),
  fileType: t.String(),
  fileSize: t.Number(),
  fileContent: t.String(),
})

export const uploadImageOutput = t.Object({
  urlPresigned: t.String(),
  publicUrl: t.String(),
})

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
]

const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4MB;

type UploadImageInput = Static<typeof uploadImageInput>;
type UploadImageOutput = Static<typeof uploadImageOutput>;

export async function uploadImageUseCase(input: UploadImageInput): Promise<UploadImageOutput> {

  const s3 = S3PublicService.getInstance();

  if (!ALLOWED_MIME_TYPES.includes(input.fileType)) {
    throw new BadRequestError("Invalid file type. Allowed: image/png, image/jpeg, image/webp");
  }

  if (input.fileSize > MAX_SIZE_BYTES) {
    throw new BadRequestError("File size too large. Max 4MB");
  }

  const normalizedFileName = input.fileName.toLowerCase().replace(/ /g, "-");

  const key = `images/${normalizedFileName}-${Date.now()}`

  const urlPresigned = await s3.generatePresignedUrl({
    key,
    contentType: input.fileType,
    expireInSeconds: 60 * 15, // 15 minutes
  })

  const publicUrl = s3.getPublicUrl(key);

  return {
    urlPresigned,
    publicUrl,
  }
}