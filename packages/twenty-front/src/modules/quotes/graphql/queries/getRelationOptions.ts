import { gql } from '@apollo/client';

export const GET_COMPANIES = gql`
  query GetCompanies($filter: CompanyFilterInput) {
    companies(filter: $filter, first: 100) {
      edges {
        node {
          id
          name
          createdAt
        }
      }
    }
  }
`;

export const GET_PEOPLE = gql`
  query GetPeople($filter: PersonFilterInput) {
    people(filter: $filter, first: 100) {
      edges {
        node {
          id
          name {
            firstName
            lastName
          }
          emails {
            primaryEmail
          }
          company {
            id
            name
          }
          createdAt
        }
      }
    }
  }
`;

export const GET_PROJECTS = gql`
  query GetProjects($filter: ProjectFilterInput) {
    projects(filter: $filter, first: 100) {
      edges {
        node {
          id
          name
          status
          company {
            id
            name
          }
          createdAt
        }
      }
    }
  }
`;
