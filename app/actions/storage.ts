'use server'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { v4 as uuidv4 } from 'uuid'

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No file provided')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const contentType = file.type

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      })
    )

    // Construct the public URL
    // If R2_PUBLIC_URL is provided, use it. Otherwise fall back to a default or assume it's configured.
    // Usually R2 public access is via a custom domain or worker.
    const url = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${fileName}`
      : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileName}` // Fallback (might not be publicly accessible directly)

    return {
      success: true,
      url,
      fileName: file.name, // Original name
      storedName: fileName, // Unique name
      type: contentType,
      size: file.size,
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    }
  }
}
