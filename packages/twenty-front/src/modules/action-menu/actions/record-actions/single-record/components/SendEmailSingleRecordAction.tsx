import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useContextStoreObjectMetadataItemOrThrow } from '@/context-store/hooks/useContextStoreObjectMetadataItemOrThrow';
import { useEmailComposer } from '@/email-composer/hooks/useEmailComposer';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useRecoilValue } from 'recoil';
import { isDefined } from 'twenty-shared/utils';

export const SendEmailSingleRecordAction = () => {
  const { objectMetadataItem } = useContextStoreObjectMetadataItemOrThrow();
  const recordId = useSelectedRecordIdOrThrow();
  const { openEmailComposer } = useEmailComposer();
  const selectedRecord = useRecoilValue(recordStoreFamilyState(recordId));

  const handleClick = () => {
    if (!isDefined(selectedRecord)) {
      return;
    }

    const objectName = objectMetadataItem.nameSingular;

    // Build context based on object type
    if (objectName === CoreObjectNameSingular.Person) {
      // For Person records, email them directly
      const email =
        selectedRecord.emails?.primaryEmail ?? selectedRecord.email ?? '';
      openEmailComposer({
        defaultTo: email,
        context: {
          personFirstName: selectedRecord.name?.firstName ?? '',
          personLastName: selectedRecord.name?.lastName ?? '',
          personEmail: email,
          companyName: selectedRecord.company?.name ?? '',
        },
      });
    } else if (objectName === CoreObjectNameSingular.Company) {
      // For Company records, open composer with company context
      // User can choose a contact or enter email manually
      openEmailComposer({
        context: {
          companyName: selectedRecord.name ?? '',
        },
      });
    } else if (objectName === CoreObjectNameSingular.Opportunity) {
      // For Opportunity records, use point of contact if available
      const person = selectedRecord.pointOfContact;
      const email = person?.emails?.primaryEmail ?? person?.email ?? '';
      openEmailComposer({
        defaultTo: email,
        context: {
          personFirstName: person?.name?.firstName ?? '',
          personLastName: person?.name?.lastName ?? '',
          personEmail: email,
          companyName: selectedRecord.company?.name ?? '',
        },
      });
    } else {
      // Generic fallback for other objects
      openEmailComposer({});
    }
  };

  return <Action onClick={handleClick} />;
};
