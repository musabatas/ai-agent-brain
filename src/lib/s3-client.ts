import { S3Client } from '@aws-sdk/client-s3';

// Create a function to get the S3 client
function getS3Client() {
  // Check for required environment variables
  const config = {
    region: process.env.STORAGE_REGION || 'ams3',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    endpoint: process.env.STORAGE_ENDPOINT,
  };

  // Log configuration (without sensitive data)
  console.log('Initializing S3 client with:', {
    region: config.region,
    endpoint: config.endpoint,
    hasAccessKey: !!config.accessKeyId,
    hasSecretKey: !!config.secretAccessKey,
  });

  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
    forcePathStyle: true,
  });
}

// Export a lazy-loaded client
let s3ClientInstance: S3Client | null = null;

export function getS3ClientInstance(): S3Client {
  if (!s3ClientInstance) {
    try {
      s3ClientInstance = getS3Client();
    } catch (error) {
      console.error('Failed to initialize S3 client:', error);
      throw error;
    }
  }
  return s3ClientInstance;
}
