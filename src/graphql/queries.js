import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents {
    allEvents {
      Id
      Title
      Location
      City
      Country
      EventType
      Genre
      Capacity
      ReservedSpots
      Description
      DateTime
      PhotoUrl
      FormLink
      createdBy {
        id
        username
      }
      Tags {
        Id
        Name
      }
    }
  }
`;

export const GET_EVENT_BY_ID = gql`
  query GetEventById($id: ID!) {
    eventById(id: $id) {
      Id
      Title
      Location
      City
      Country
      EventType
      Genre
      Capacity
      ReservedSpots
      Description
      DateTime
      PhotoUrl
      FormLink
      createdBy {
        id
        username
      }
      Tags {
        Id
        Name
      }
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: EventInput!) {
    createEvent(input: $input) {
      Id
      Title
      createdBy {
        id
        username
      }
    }
  }
`;

// export const UPDATE_EVENT = gql`
//   mutation UpdateEvent($id: ID!, $input: EventInput!) {
//     updateEvent(id: $id, input: $input) {
//       Id
//       Title
//       Location
//       City
//       Country
//       EventType
//       Genre
//       Capacity
//       Description
//       DateTime
//       PhotoUrl
//       FormLink
//       createdBy {
//         id
//         username
//       }
//       Tags {
//         Id
//         Name
//       }
//     }
//   }
// `;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: EventInput!) {
    updateEvent(id: $id, input: $input) {
      Id
      Title
      createdBy {
        id
        username
      }
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

export const GET_ALL_LOGS = gql`
  query GetAllLogs {
    allLogs {
      id
      userId
      userRole
      action
      timestamp
    }
  }
`;

export const GET_OBSERVATION_LIST = gql`
  query GetObservationList {
    observationList {
      id
      userId
      reason
      severity
      timestamp
    }
  }
`;