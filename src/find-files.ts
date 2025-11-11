import * as core from '@actions/core'
import { drive_v3 } from '@googleapis/drive'

/**
 * Check if a string is a glob pattern
 */
function isGlobPattern(pattern: string): boolean {
  return /[*?[\]{}]/.test(pattern)
}

/**
 * Escape single quotes for Google Drive API queries
 */
function escapeQueryValue(value: string): string {
  return value.replace(/'/g, "\\'")
}

/**
 * Convert a glob pattern to a Google Drive API query
 * Returns a query string and a regex pattern for client-side filtering
 */
function globToQuery(pattern: string): { query: string; regex: RegExp } {
  // Escape special characters for regex
  let regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except * and ?
    .replace(/\*/g, '.*') // * matches any sequence
    .replace(/\?/g, '.') // ? matches single character

  // Build Google Drive query
  let driveQuery = ''

  // Handle common patterns for Drive API
  if (pattern.startsWith('*') && pattern.endsWith('*')) {
    // *text* -> contains
    const text = pattern.slice(1, -1)
    if (!isGlobPattern(text)) {
      driveQuery = `name contains '${escapeQueryValue(text)}'`
    }
  } else if (pattern.startsWith('*')) {
    // *text -> ends with (not directly supported, we'll filter client-side)
    // Use trashed=false as a valid query that returns all non-trashed files
    driveQuery = 'trashed=false'
  } else if (pattern.endsWith('*')) {
    // text* -> starts with (not directly supported, but we can use contains)
    const prefix = pattern.slice(0, -1)
    if (!isGlobPattern(prefix)) {
      driveQuery = `name contains '${escapeQueryValue(prefix)}'`
    }
  }

  // If no specific query was built, use a generic one
  if (!driveQuery) {
    driveQuery = 'trashed=false'
  }

  return {
    query: driveQuery,
    regex: new RegExp(`^${regexPattern}$`, 'i')
  }
}

export default async function findFiles(
  service: drive_v3.Drive,
  folderId: string,
  name: string
): Promise<drive_v3.Schema$File[] | undefined> {
  console.log(`Checking for file ${name}`)

  try {
    let query: string
    let filterRegex: RegExp | null = null

    if (isGlobPattern(name)) {
      // Handle glob pattern
      console.log(`Detected glob pattern: ${name}`)
      const { query: driveQuery, regex } = globToQuery(name)
      query = `'${folderId}' in parents and ${driveQuery}`
      filterRegex = regex
    } else {
      // Exact match for normal filenames
      query = `'${folderId}' in parents and name = '${name}'`
    }

    const findFilesResponse = await service.files.list({
      fields: 'files(id, name, parents)',
      q: query
    })

    let files = findFilesResponse.data.files || []

    // Apply client-side filtering for glob patterns
    if (filterRegex) {
      files = files.filter(file => file.name && filterRegex.test(file.name))
      console.log(
        `Found ${files.length} files matching pattern after filtering`
      )
    } else {
      console.log(`Found ${files.length} files`)
    }

    return files
  } catch (error) {
    core.setFailed(`Unable to check find file: ${(error as Error).message}`)
  }
}
