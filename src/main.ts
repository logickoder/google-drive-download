import * as core from '@actions/core'
import * as google from '@googleapis/drive'
import downloadFile from './download-file'
import findFiles from './find-files'

export async function run(): Promise<void> {
  try {
    // Get inputs
    const filename = core.getInput(inputs.filename)
    const fileId = core.getInput(inputs.fileId)
    const folderId = core.getInput(inputs.folderId, {
      required: true
    })
    const destination = core.getInput(inputs.destination, {
      required: true
    })
    const authType = core.getInput(inputs.authType) || 'service'

    let auth

    if (authType === 'oauth') {
      // OAuth authentication
      const clientId = core.getInput(inputs.clientId, { required: true })
      const clientSecret = core.getInput(inputs.clientSecret, {
        required: true
      })
      const refreshToken = core.getInput(inputs.refreshToken, {
        required: true
      })

      core.setSecret(clientSecret)
      core.setSecret(refreshToken)

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      })
      auth = oauth2Client
    } else {
      // Service account authentication (legacy)
      const credentials = core.getInput(inputs.credentials)
      if (!credentials) {
        core.setFailed(
          'credentials input is required when using service account authentication'
        )
        return
      }
      core.setSecret(credentials)

      auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: [inputs.scope]
      })
    }

    const drive = google.drive({
      version: 'v3',
      auth
    })

    const files = Array<google.drive_v3.Schema$File>()

    // if no file id is provided, search for the file
    if (!fileId) {
      if (!filename) {
        core.setFailed(
          `Either ${inputs.filename} or ${inputs.fileId} must be provided`
        )
        return
      }
      if (!folderId) {
        core.setFailed(
          `${inputs.folderId} must be provided to find ${filename}`
        )
        return
      }
      files.push(...((await findFiles(drive, folderId, filename)) || []))
    } else {
      const response = await drive.files.get({
        fileId,
        fields: 'id,name'
      })
      files.push(response.data)
    }

    // download the files
    for (const file of files) {
      await downloadFile(drive, file, destination)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error as Error)
  }
}

export const inputs = {
  scope: 'https://www.googleapis.com/auth/drive.file',
  filename: 'filename',
  fileId: 'fileId',
  folderId: 'folderId',
  credentials: 'credentials',
  destination: 'destination',
  authType: 'authType',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  refreshToken: 'refreshToken'
}
