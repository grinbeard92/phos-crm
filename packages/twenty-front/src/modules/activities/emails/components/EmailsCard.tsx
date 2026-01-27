import styled from '@emotion/styled';

import { ActivityList } from '@/activities/components/ActivityList';
import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { EmailThreadPreview } from '@/activities/emails/components/EmailThreadPreview';
import { TIMELINE_THREADS_DEFAULT_PAGE_SIZE } from '@/activities/emails/constants/Messaging';
import { getTimelineThreadsFromCompanyId } from '@/activities/emails/graphql/queries/getTimelineThreadsFromCompanyId';
import { getTimelineThreadsFromOpportunityId } from '@/activities/emails/graphql/queries/getTimelineThreadsFromOpportunityId';
import { getTimelineThreadsFromPersonId } from '@/activities/emails/graphql/queries/getTimelineThreadsFromPersonId';
import { useCustomResolver } from '@/activities/hooks/useCustomResolver';
import {
  EMAIL_COMPOSE_MODAL_ID,
  EmailComposeModal,
} from '@/email-composer/components/EmailComposeModal';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { H1Title, H1TitleFontColor, IconSend } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
  EMPTY_PLACEHOLDER_TRANSITION_PROPS,
  Section,
} from 'twenty-ui/layout';
import {
  FeatureFlagKey,
  type TimelineThread,
  type TimelineThreadsWithTotal,
} from '~/generated/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
  padding: ${({ theme }) => theme.spacing(6, 6, 2)};
  height: 100%;
  overflow: auto;
`;

const StyledH1Title = styled(H1Title)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledEmailCount = styled.span`
  color: ${({ theme }) => theme.font.color.light};
`;

const StyledComposeButtonContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const StyledNoEmailNote = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

type PersonRecord = ObjectRecord & {
  name: { firstName: string; lastName: string };
  emails: { primaryEmail: string } | null;
  company?: { name: string } | null;
};

export const EmailsCard = () => {
  const targetRecord = useTargetRecord();
  const { openModal } = useModal();
  const isEmailComposerEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_EMAIL_COMPOSER_ENABLED,
  );

  const isPerson =
    targetRecord.targetObjectNameSingular === CoreObjectNameSingular.Person;

  const { record: personRecord } = useFindOneRecord<PersonRecord>({
    objectNameSingular: CoreObjectNameSingular.Person,
    objectRecordId: isPerson ? targetRecord.id : undefined,
    recordGqlFields: {
      id: true,
      name: true,
      emails: true,
      company: {
        name: true,
      },
    },
    skip: !isPerson || !isEmailComposerEnabled,
  });

  const handleComposeClick = () => {
    openModal(EMAIL_COMPOSE_MODAL_ID);
  };

  const [query, queryName] =
    targetRecord.targetObjectNameSingular === CoreObjectNameSingular.Person
      ? [getTimelineThreadsFromPersonId, 'getTimelineThreadsFromPersonId']
      : targetRecord.targetObjectNameSingular === CoreObjectNameSingular.Company
        ? [getTimelineThreadsFromCompanyId, 'getTimelineThreadsFromCompanyId']
        : [
            getTimelineThreadsFromOpportunityId,
            'getTimelineThreadsFromOpportunityId',
          ];

  const { data, firstQueryLoading, isFetchingMore, fetchMoreRecords } =
    useCustomResolver<TimelineThreadsWithTotal>(
      query,
      queryName,
      'timelineThreads',
      targetRecord,
      TIMELINE_THREADS_DEFAULT_PAGE_SIZE,
    );

  const { totalNumberOfThreads, timelineThreads } = data?.[queryName] ?? {};
  const hasMoreTimelineThreads =
    timelineThreads && totalNumberOfThreads
      ? timelineThreads?.length < totalNumberOfThreads
      : false;

  const handleLastRowVisible = async () => {
    if (hasMoreTimelineThreads) {
      await fetchMoreRecords();
    }
  };

  if (firstQueryLoading) {
    return <SkeletonLoader />;
  }

  if (!firstQueryLoading && !timelineThreads?.length) {
    const emailContext =
      isPerson && personRecord
        ? {
            personId: personRecord.id,
            personFirstName: personRecord.name?.firstName || '',
            personLastName: personRecord.name?.lastName || '',
            personEmail: personRecord.emails?.primaryEmail || '',
            companyName: personRecord.company?.name || '',
          }
        : undefined;

    return (
      <>
        <AnimatedPlaceholderEmptyContainer
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...EMPTY_PLACEHOLDER_TRANSITION_PROPS}
        >
          <AnimatedPlaceholder type="emptyInbox" />
          <AnimatedPlaceholderEmptyTextContainer>
            <AnimatedPlaceholderEmptyTitle>
              <Trans>Empty Inbox</Trans>
            </AnimatedPlaceholderEmptyTitle>
            <AnimatedPlaceholderEmptySubTitle>
              <Trans>
                No email exchange has occurred with this record yet.
              </Trans>
            </AnimatedPlaceholderEmptySubTitle>
          </AnimatedPlaceholderEmptyTextContainer>
          {isEmailComposerEnabled && isPerson && (
            <StyledComposeButtonContainer>
              <Button
                Icon={IconSend}
                title={t`Compose Email`}
                variant="secondary"
                accent="default"
                size="medium"
                onClick={handleComposeClick}
              />
              {!personRecord?.emails?.primaryEmail && (
                <StyledNoEmailNote>
                  <Trans>
                    Add an email address to this person to send emails directly.
                  </Trans>
                </StyledNoEmailNote>
              )}
            </StyledComposeButtonContainer>
          )}
        </AnimatedPlaceholderEmptyContainer>
        {isEmailComposerEnabled && (
          <EmailComposeModal
            context={emailContext}
            defaultTo={personRecord?.emails?.primaryEmail || ''}
          />
        )}
      </>
    );
  }

  return (
    <StyledContainer>
      <Section>
        <StyledH1Title
          title={
            <>
              <Trans>Inbox</Trans>{' '}
              <StyledEmailCount>{totalNumberOfThreads}</StyledEmailCount>
            </>
          }
          fontColor={H1TitleFontColor.Primary}
        />
        {!firstQueryLoading && (
          <ActivityList>
            {timelineThreads?.map((thread: TimelineThread) => (
              <EmailThreadPreview key={thread.id} thread={thread} />
            ))}
          </ActivityList>
        )}
        <CustomResolverFetchMoreLoader
          loading={isFetchingMore || firstQueryLoading}
          onLastRowVisible={handleLastRowVisible}
        />
      </Section>
    </StyledContainer>
  );
};
