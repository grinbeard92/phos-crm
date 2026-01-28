import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { buildSignedPath, isDefined } from 'twenty-shared/utils';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import {
  FileFolder,
  useUploadFileMutation,
} from '~/generated-metadata/graphql';

/**
 * Hook for uploading inline images in the email composer.
 * Unlike useUploadAttachmentFile, this only uploads the file and returns a URL -
 * it does NOT create an Attachment record (which would fail for Message objects).
 */
export const useUploadEmailImage = () => {
  const coreClient = useApolloCoreClient();
  const [uploadFile] = useUploadFileMutation({ client: coreClient });

  const uploadEmailImage = async (file: File): Promise<string> => {
    const result = await uploadFile({
      variables: {
        file,
        fileFolder: FileFolder.Attachment,
      },
    });

    const response = result?.data?.uploadFile;

    if (!isDefined(response)) {
      throw new Error("Couldn't upload the image.");
    }

    // Build the signed URL for the uploaded file
    const signedPath = buildSignedPath({
      path: response.path,
      token: response.token,
    });

    return `${REACT_APP_SERVER_BASE_URL}/files/${signedPath}`;
  };

  return { uploadEmailImage };
};
