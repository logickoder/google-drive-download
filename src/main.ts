import * as core from '@actions/core'
import * as google from '@googleapis/drive'
import downloadFile from './download-file'
import findFiles from './find-files'

export async function run(): Promise<void> {
  try {
    // Get inputs
    const filename = core.getInput(inputs.filename)
    const fileId = core.getInput(inputs.fileId)
    const folderId = core.getInput(inputs.folderId)
    const downloadLocation = core.getInput(inputs.downloadLocation, {
      required: true
    })

    const credentials = core.getInput(inputs.credentials, { required: true })
    core.setSecret(credentials)

    const drive = google.drive({
      version: 'v3',
      auth:
        credentials &&
        new google.auth.GoogleAuth({
          credentials: JSON.parse(credentials),
          scopes: [inputs.scope]
        })
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
      await downloadFile(drive, file, downloadLocation)
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
  downloadLocation: 'downloadLocation'
}
