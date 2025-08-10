import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

export class GoogleDriveService {
  private drive: any
  private auth: JWT

  constructor() {
    // Check if all required environment variables are present
    if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_DRIVE_CLIENT_EMAIL environment variable is required')
    }
    if (!process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
      throw new Error('GOOGLE_DRIVE_PRIVATE_KEY environment variable is required')
    }
    if (!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_PARENT_FOLDER_ID environment variable is required')
    }

    console.log('Google Drive config check:')
    console.log('- Client email:', process.env.GOOGLE_DRIVE_CLIENT_EMAIL ? 'SET' : 'MISSING')
    console.log('- Private key:', process.env.GOOGLE_DRIVE_PRIVATE_KEY ? 'SET' : 'MISSING')
    console.log('- Parent folder:', process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID ? 'SET' : 'MISSING')

    // Initialize JWT auth with service account credentials
    this.auth = new JWT({
      email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    this.drive = google.drive({ version: 'v3', auth: this.auth })
  }

  /**
   * Create a resumable upload session for video files
   */
  async createResumableUploadSession(
    fileName: string,
    fileSize: number,
    mimeType: string = 'video/webm'
  ): Promise<{ uploadUrl: string }> {
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID

    const metadata = {
      name: fileName,
      parents: parentFolderId ? [parentFolderId] : undefined,
    }

    try {
      console.log('Creating Google Drive upload session with:')
      console.log('- File name:', fileName)
      console.log('- File size:', fileSize)
      console.log('- MIME type:', mimeType)
      console.log('- Parent folder:', parentFolderId)

      // Get access token properly
      const accessToken = await this.auth.getAccessToken()
      console.log('Access token obtained:', accessToken ? 'YES' : 'NO')
      console.log('Access token length:', accessToken ? accessToken.length : 0)
      
      if (!accessToken) {
        throw new Error('Failed to get access token from Google Auth')
      }

      // Use the correct resumable upload endpoint
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': fileSize.toString(),
        },
        body: JSON.stringify(metadata),
      })

      console.log('Google Drive response status:', response.status)
      console.log('Google Drive response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Google Drive API error:', errorText)
        throw new Error(`Google Drive API error: ${response.status} ${errorText}`)
      }

      const uploadUrl = response.headers.get('location')
      
      if (!uploadUrl) {
        console.error('No location header in response:', Object.fromEntries(response.headers.entries()))
        const responseBody = await response.text()
        console.error('Response body:', responseBody)
        throw new Error('No upload URL received from Google Drive')
      }

      console.log('Google Drive upload URL:', uploadUrl)
      
      return {
        uploadUrl,
      }
    } catch (error) {
      console.error('Error creating resumable upload session:', error)
      if (error.response) {
        console.error('Google Drive API error response:', error.response.data)
        console.error('Google Drive API error status:', error.response.status)
      }
      throw new Error(`Failed to create upload session: ${error.message}`)
    }
  }

  /**
   * Create folder structure for interview videos
   */
  async createFolderStructure(
    roleSlug: string,
    year: string,
    month: string,
    userId: string
  ): Promise<string> {
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!

    // Create InterviewVideos folder if it doesn't exist
    const interviewVideosFolderId = await this.createFolderIfNotExists(
      'InterviewVideos',
      parentFolderId
    )

    // Create role folder
    const roleFolderId = await this.createFolderIfNotExists(
      roleSlug,
      interviewVideosFolderId
    )

    // Create year folder
    const yearFolderId = await this.createFolderIfNotExists(year, roleFolderId)

    // Create month folder
    const monthFolderId = await this.createFolderIfNotExists(month, yearFolderId)

    // Create user folder
    const userFolderId = await this.createFolderIfNotExists(userId, monthFolderId)

    return userFolderId
  }

  private async createFolderIfNotExists(
    folderName: string,
    parentId: string
  ): Promise<string> {
    try {
      // Check if folder already exists
      const existingFolders = await this.drive.files.list({
        q: `name='${folderName}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
      })

      if (existingFolders.data.files && existingFolders.data.files.length > 0) {
        return existingFolders.data.files[0].id
      }

      // Create new folder
      const folder = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id',
      })

      return folder.data.id
    } catch (error) {
      console.error(`Error creating folder ${folderName}:`, error)
      throw new Error(`Failed to create folder: ${folderName}`)
    }
  }

  /**
   * Get file metadata and download URL
   */
  async getFileInfo(fileId: string) {
    try {
      const file = await this.drive.files.get({
        fileId,
        fields: 'id,name,size,createdTime,webViewLink,webContentLink',
      })

      return file.data
    } catch (error) {
      console.error('Error getting file info:', error)
      throw new Error('Failed to get file information')
    }
  }

  /**
   * Generate file path for interview video
   */
  static generateFilePath(
    roleSlug: string,
    userId: string,
    interviewId: string
  ): string {
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    
    return `InterviewVideos/${roleSlug}/${year}/${month}/${userId}/${interviewId}.webm`
  }

  /**
   * Generate file name for interview video
   */
  static generateFileName(interviewId: string): string {
    return `${interviewId}.webm`
  }
}

export const driveService = new GoogleDriveService()