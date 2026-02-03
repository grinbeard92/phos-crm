import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { GET_COMPANIES, GET_PEOPLE, GET_PROJECTS } from '../graphql/queries/getRelationOptions';

type SelectOption = {
  value: string;
  label: string;
};

export const useCompanyOptions = (selectedCompanyId?: string | null) => {
  const { data, loading } = useQuery(GET_COMPANIES, {
    variables: {
      filter: {},
    },
  });

  const options: SelectOption[] = useMemo(() => {
    if (!data?.companies?.edges) return [];

    return data.companies.edges.map((edge: any) => ({
      value: edge.node.id,
      label: edge.node.name || 'Unnamed Company',
    }));
  }, [data]);

  return { options, loading };
};

export const useContactOptions = (companyId?: string | null) => {
  const { data, loading } = useQuery(GET_PEOPLE, {
    variables: {
      filter: companyId
        ? {
            companyId: { eq: companyId },
          }
        : {},
    },
    skip: !companyId, // Only fetch if company is selected
  });

  const options: SelectOption[] = useMemo(() => {
    if (!data?.people?.edges) return [];

    return data.people.edges.map((edge: any) => {
      const firstName = edge.node.name?.firstName || '';
      const lastName = edge.node.name?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Contact';

      return {
        value: edge.node.id,
        label: fullName,
      };
    });
  }, [data]);

  return { options, loading };
};

export const useProjectOptions = (companyId?: string | null) => {
  const { data, loading } = useQuery(GET_PROJECTS, {
    variables: {
      filter: companyId
        ? {
            companyId: { eq: companyId },
          }
        : {},
    },
  });

  const options: SelectOption[] = useMemo(() => {
    if (!data?.projects?.edges) return [];

    return data.projects.edges.map((edge: any) => ({
      value: edge.node.id,
      label: edge.node.name || 'Unnamed Project',
    }));
  }, [data]);

  return { options, loading };
};
