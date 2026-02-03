import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { PHOS_FEATURE_FLAGS } from '@/settings/phos/constants/PhosFeatureFlags';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useRecoilState } from 'recoil';
import { isDefined, getSettingsPath } from 'twenty-shared/utils';
import { SettingsPath } from 'twenty-shared/types';
import { H2Title } from 'twenty-ui/display';
import { Toggle } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import {
  type FeatureFlagKey,
  useUpdateWorkspaceFeatureFlagMutation,
} from '~/generated-metadata/graphql';

const StyledFlagDescription = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

export const SettingsPhosFeatures = () => {
  const [currentWorkspace, setCurrentWorkspace] = useRecoilState(
    currentWorkspaceState,
  );
  const { enqueueErrorSnackBar } = useSnackBar();
  const [updateFeatureFlag] = useUpdateWorkspaceFeatureFlagMutation();

  const handleToggle = async (flagKey: FeatureFlagKey, newValue: boolean) => {
    if (!currentWorkspace) return;

    const previousFlags = currentWorkspace.featureFlags;

    // Optimistic update
    const flagExists = previousFlags?.some((f) => f.key === flagKey);
    const updatedFlags = flagExists
      ? previousFlags?.map((f) =>
          f.key === flagKey ? { ...f, value: newValue } : f,
        )
      : [
          ...(previousFlags ?? []),
          { key: flagKey, value: newValue, id: flagKey },
        ];

    setCurrentWorkspace({
      ...currentWorkspace,
      featureFlags: updatedFlags ?? [],
    });

    await updateFeatureFlag({
      variables: {
        workspaceId: currentWorkspace.id,
        featureFlag: flagKey,
        value: newValue,
      },
      onError: (error) => {
        // Roll back optimistic update
        if (isDefined(previousFlags)) {
          setCurrentWorkspace({
            ...currentWorkspace,
            featureFlags: previousFlags,
          });
        }
        enqueueErrorSnackBar({
          message: t`Failed to update feature flag. ${error.message}`,
        });
      },
    });
  };

  return (
    <SubMenuTopBarContainer
      title={t`Phos Features`}
      links={[
        {
          children: t`Other`,
          href: getSettingsPath(SettingsPath.PhosFeatures),
        },
        { children: t`Phos Features` },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Feature Flags`}
            description={t`Enable or disable custom Phos Industries features`}
          />
          <Table>
            <TableBody>
              <TableRow
                gridAutoColumns="2fr 3fr 100px"
                mobileGridAutoColumns="1fr 80px"
              >
                <TableHeader>{t`Feature`}</TableHeader>
                <TableHeader>{t`Description`}</TableHeader>
                <TableHeader align="right">{t`Status`}</TableHeader>
              </TableRow>
              {PHOS_FEATURE_FLAGS.map((pf) => {
                const flag = currentWorkspace?.featureFlags?.find(
                  (f) => f.key === pf.key,
                );

                return (
                  <TableRow
                    gridAutoColumns="2fr 3fr 100px"
                    mobileGridAutoColumns="1fr 80px"
                    key={pf.key}
                  >
                    <TableCell>{pf.label}</TableCell>
                    <TableCell>
                      <StyledFlagDescription>
                        {pf.description}
                      </StyledFlagDescription>
                    </TableCell>
                    <TableCell align="right">
                      <Toggle
                        value={flag?.value ?? false}
                        onChange={(newValue) => handleToggle(pf.key, newValue)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Section>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
