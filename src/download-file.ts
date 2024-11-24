import { drive_v3 } from '@googleapis/drive'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

export default async function downloadFile(
  service: drive_v3.Drive,
  file: drive_v3.Schema$File,
  downloadPath: string
): Promise<void> {
  if (!file.id || !file.name) {
    core.warning(`File ${file.name} has no id or name, skipping`)
    return
  }

  const isDirectory = downloadPath.endsWith('/')

  // Extract the directory path from the download path and
  // create the directory if it doesn't exist
  fs.mkdirSync(isDirectory ? downloadPath : path.dirname(downloadPath), {
    recursive: true
  })

  try {
    console.log(`Downloading ${file.name} to ${downloadPath}`)

    const response = await service.files.get(
      {
        fileId: file.id,
        alt: 'media'
      },
      { responseType: 'stream' }
    )

    // Get the file path and create a writable stream and
    // pipe the response into it
    const destinationStream = fs.createWriteStream(
      isDirectory ? path.join(downloadPath, file.name) : downloadPath
    )
    response.data.pipe(destinationStream)

    // Wait for it to finish
    await new Promise((resolve, reject) => {
      destinationStream.on('finish', resolve)
      destinationStream.on('error', reject)
    })
  } catch (e) {
    core.setFailed(`Unable to download ${file.name}: ${(e as Error).message}`)
  }
}
