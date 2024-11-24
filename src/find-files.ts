import * as core from '@actions/core'
import { drive_v3 } from '@googleapis/drive'

export default async function findFiles(
  service: drive_v3.Drive,
  folderId: string,
  name: string
): Promise<drive_v3.Schema$File[] | undefined> {
  console.log(`Checking for file ${name}`)

  try {
    const findFilesResponse = await service.files.list({
      fields: 'files(id, name, parents)',
      q: `'${folderId}' in parents and name = '${name}'`
    })

    console.log(`Found ${findFilesResponse.data.files?.length} files`)

    // const foundFolders =
    //   findFilesResponse.data.files?.filter(
    //     file => file.parents && file.parents.includes(folderId)
    //   ) || []

    return findFilesResponse.data.files
  } catch (error) {
    core.setFailed(`Unable to check find file: ${(error as Error).message}`)
  }
}
