import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { IconFileText, IconPlus } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
  EMPTY_PLACEHOLDER_TRANSITION_PROPS,
} from 'twenty-ui/layout';

import { useQuotes } from '../hooks/useQuotes';
import { useOpenCreateQuoteDrawer } from '../hooks/useOpenCreateQuoteDrawer';
import { QuoteList } from './QuoteList';

const StyledQuotesContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: auto;
`;

export const QuotesCard = () => {
  const targetRecord = useTargetRecord();
  const { quotes, loading, totalCountQuotes, fetchMoreQuotes, hasNextPage } =
    useQuotes(targetRecord);

  const handleLastRowVisible = async () => {
    if (hasNextPage) {
      await fetchMoreQuotes();
    }
  };

  const openCreateQuote = useOpenCreateQuoteDrawer();

  const isQuotesEmpty = !quotes || quotes.length === 0;

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });

  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  const hasObjectUpdatePermissions = objectPermissions.canUpdateObjectRecords;

  if (loading && isQuotesEmpty) {
    return <SkeletonLoader />;
  }

  if (isQuotesEmpty) {
    return (
      <AnimatedPlaceholderEmptyContainer
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...EMPTY_PLACEHOLDER_TRANSITION_PROPS}
      >
        <AnimatedPlaceholder type="noNote" />
        <AnimatedPlaceholderEmptyTextContainer>
          <AnimatedPlaceholderEmptyTitle>
            {t`No quotes`}
          </AnimatedPlaceholderEmptyTitle>
          <AnimatedPlaceholderEmptySubTitle>
            {t`There are no quotes associated with this record.`}
          </AnimatedPlaceholderEmptySubTitle>
        </AnimatedPlaceholderEmptyTextContainer>
        {hasObjectUpdatePermissions && (
          <Button
            Icon={IconPlus}
            title={t`New quote`}
            variant="secondary"
            onClick={() =>
              openCreateQuote({
                targetRecord,
              })
            }
          />
        )}
      </AnimatedPlaceholderEmptyContainer>
    );
  }

  return (
    <StyledQuotesContainer>
      <QuoteList
        title={t`All Quotes`}
        quotes={quotes}
        totalCount={totalCountQuotes}
        button={
          hasObjectUpdatePermissions && (
            <Button
              Icon={IconPlus}
              size="small"
              variant="secondary"
              title={t`Add quote`}
              onClick={() =>
                openCreateQuote({
                  targetRecord,
                })
              }
            />
          )
        }
      />
      <CustomResolverFetchMoreLoader
        loading={loading}
        onLastRowVisible={handleLastRowVisible}
      />
    </StyledQuotesContainer>
  );
};
