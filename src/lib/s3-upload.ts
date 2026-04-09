import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { uid } from './helpers';
import { getS3ClientInstance } from './s3-client';

// Get storage configuration
function getConfig() {
  return {
    bucket: process.env.STORAGE_BUCKET || 'shoplit',
    cdnUrl: process.env.STORAGE_CDN_URL?.replace(/\/$/, ''),
    endpoint: process.env.STORAGE_ENDPOINT?.replace(/\/$/, ''),
  };
}

function getFileUrl(key: string): string {
  const config = getConfig();

  // Prefer CDN URL if available
  if (config.cdnUrl) {
    return `${config.cdnUrl}/${key}`;
  }

  // Fallback to direct endpoint
  return `${config.endpoint}/${key}`;
}

export async function uploadToS3(
  file: File,
  directory: string,
): Promise<string> {
  try {
    const config = getConfig();

    // Validate input
    if (!file) throw new Error('No file provided');
    if (!directory) throw new Error('No directory specified');

    // Generate unique filename
    const filename = `${uid()}_${file.name}`;
    const key = `${directory}/${filename}`;

    // Log upload attempt
    console.log('Uploading file:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      directory,
      bucket: config.bucket,
    });

    // Upload to storage
    const s3Client = getS3ClientInstance();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000',
        ACL: 'public-read',
      }),
    );

    // Generate URL
    const fileUrl = getFileUrl(key);
    console.log('File uploaded successfully:', { key, fileUrl });
    return fileUrl;
  } catch (error) {
    console.error('Upload failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      file: file?.name,
      directory,
    });
    throw new Error('Failed to upload file');
  }
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    const config = getConfig();
    if (!fileUrl) throw new Error('No file URL provided');

    // Extract key from URL
    let key = fileUrl;
    if (config.cdnUrl && fileUrl.startsWith(config.cdnUrl)) {
      key = fileUrl.replace(`${config.cdnUrl}/`, '');
    } else if (config.endpoint && fileUrl.startsWith(config.endpoint)) {
      key = fileUrl.replace(`${config.endpoint}/`, '');
    }

    // Delete from storage
    const s3Client = getS3ClientInstance();
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );

    console.log('File deleted successfully:', { key });
  } catch (error) {
    console.error('Delete failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fileUrl,
    });
    throw new Error('Failed to delete file');
  }
}
