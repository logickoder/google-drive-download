# Google Drive Download Action

A GitHub Action to download files from Google Drive using either OAuth2 or
Service Account authentication.

> [!IMPORTANT] **OAuth2 Authentication Recommended**: Google has deprecated
> certain uses of service accounts and is encouraging the use of OAuth2 for
> better security and user control. This action now supports both authentication
> methods for backward compatibility, but OAuth2 is recommended for new
> implementations.

## Features

- Download files from Google Drive by filename or file ID
- Support for wildcard patterns in filenames ([learn more](WILDCARD.md))
- Two authentication methods: OAuth2 (recommended) and Service Account (legacy)
- Secure handling of credentials and tokens

## Authentication Methods

### OAuth2 Authentication (Recommended)

OAuth2 provides better security and user control over permissions. To set up
OAuth2 authentication:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google Drive API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Configure the OAuth consent screen if not already done
6. Use a tool like Google OAuth Playground or your own application to generate a
   refresh token

### Service Account Authentication (Legacy)

Service accounts are still supported for backward compatibility, but OAuth2 is
preferred for new implementations.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google Drive API
4. Go to "Credentials" and create a Service Account
5. Download the JSON key file
6. Share your Google Drive folder/files with the service account email

## Usage

### With OAuth2 Authentication (Recommended)

```yaml
- name: Download from Google Drive
  uses: your-username/google-drive-download@v1
  with:
    authType: 'oauth'
    clientId: ${{ secrets.GOOGLE_CLIENT_ID }}
    clientSecret: ${{ secrets.GOOGLE_CLIENT_SECRET }}
    refreshToken: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
    folderId: 'your-folder-id'
    filename: 'file-to-download.pdf'
    destination: './downloads/'
```

### With Service Account Authentication (Legacy)

```yaml
- name: Download from Google Drive
  uses: your-username/google-drive-download@v1
  with:
    authType: 'service' # Optional, defaults to 'service'
    credentials: ${{ secrets.GOOGLE_CREDENTIALS }}
    folderId: 'your-folder-id'
    filename: 'file-to-download.pdf'
    destination: './downloads/'
```

### Download by File ID

```yaml
- name: Download specific file
  uses: your-username/google-drive-download@v1
  with:
    authType: 'oauth'
    clientId: ${{ secrets.GOOGLE_CLIENT_ID }}
    clientSecret: ${{ secrets.GOOGLE_CLIENT_SECRET }}
    refreshToken: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
    fileId: 'specific-file-id'
    destination: './downloads/'
```

## Inputs

| Name           | Description                                                     | Required | Default   |
| -------------- | --------------------------------------------------------------- | -------- | --------- |
| `authType`     | Authentication type: `oauth` or `service`                       | No       | `service` |
| `credentials`  | Service account credentials JSON (required for service auth)    | No\*     |           |
| `clientId`     | OAuth2 client ID (required for oauth auth)                      | No\*     |           |
| `clientSecret` | OAuth2 client secret (required for oauth auth)                  | No\*     |           |
| `refreshToken` | OAuth2 refresh token (required for oauth auth)                  | No\*     |           |
| `filename`     | Name of the file to download. Supports [wildcards](WILDCARD.md) | No\*\*   |           |
| `fileId`       | ID of the specific file to download                             | No\*\*   |           |
| `folderId`     | ID of the parent folder to search in                            | Yes      |           |
| `destination`  | Path to save the downloaded file(s)                             | Yes      |           |

\* Required based on authentication type \*\* Either `filename` or `fileId` must
be provided

## Setting up Secrets

### For OAuth2 Authentication

Add these secrets to your repository:

- `GOOGLE_CLIENT_ID`: Your OAuth2 client ID
- `GOOGLE_CLIENT_SECRET`: Your OAuth2 client secret
- `GOOGLE_REFRESH_TOKEN`: Your OAuth2 refresh token

### For Service Account Authentication

Add this secret to your repository:

- `GOOGLE_CREDENTIALS`: The entire contents of your service account JSON key
  file

## Examples

### Download multiple files with wildcards

```yaml
- name: Download all PDFs
  uses: your-username/google-drive-download@v1
  with:
    authType: 'oauth'
    clientId: ${{ secrets.GOOGLE_CLIENT_ID }}
    clientSecret: ${{ secrets.GOOGLE_CLIENT_SECRET }}
    refreshToken: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
    folderId: 'your-folder-id'
    filename: '*.pdf'
    destination: './pdfs/'
```

### Download with error handling

```yaml
- name: Download from Google Drive
  id: download
  uses: your-username/google-drive-download@v1
  continue-on-error: true
  with:
    authType: 'oauth'
    clientId: ${{ secrets.GOOGLE_CLIENT_ID }}
    clientSecret: ${{ secrets.GOOGLE_CLIENT_SECRET }}
    refreshToken: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
    folderId: 'your-folder-id'
    filename: 'important-file.txt'
    destination: './downloads/'

- name: Handle download failure
  if: steps.download.outcome == 'failure'
  run: echo "Download failed, using fallback method"
```

## Migration from Service Account to OAuth2

If you're currently using service account authentication and want to migrate to
OAuth2:

1. Set up OAuth2 credentials in Google Cloud Console
2. Generate a refresh token
3. Update your workflow to use the new authentication parameters
4. Update your repository secrets

The action maintains backward compatibility, so you can migrate at your own
pace.

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure the Google Drive files/folders are shared
   with your service account email or that your OAuth2 application has the
   necessary permissions.

2. **File Not Found**: Verify the `folderId` and `filename` are correct. The
   folder ID can be found in the Google Drive URL.

3. **Authentication Errors**:
   - For OAuth2: Check that your client ID, client secret, and refresh token are
     correct
   - For Service Accounts: Ensure the JSON credentials are properly formatted
     and the service account has access

4. **API Quota Exceeded**: Google Drive API has usage limits. Consider
   implementing retry logic or reducing the frequency of requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
