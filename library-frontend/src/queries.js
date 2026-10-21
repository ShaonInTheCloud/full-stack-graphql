import { gql } from "@apollo/client";
export const BOOK = gql`
  fragment BookDetails on Book {
    id
    title
    published
    genres
    author {
      id
      name
      born
      bookCount
    }
  }
`;
export const AUTHORS = gql`
  query Authors {
    allAuthors {
      id
      name
      born
      bookCount
    }
  }
`;
export const BOOKS = gql`
  query Books($genre: String) {
    allBooks(genre: $genre) {
      ...BookDetails
    }
  }
  ${BOOK}
`;
export const ME = gql`
  query Me {
    me {
      id
      username
      favoriteGenre
    }
  }
`;
export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`;
export const ADD = gql`
  mutation AddBook(
    $title: String!
    $author: String!
    $published: Int!
    $genres: [String!]!
  ) {
    addBook(
      title: $title
      author: $author
      published: $published
      genres: $genres
    ) {
      ...BookDetails
    }
  }
  ${BOOK}
`;
export const EDIT = gql`
  mutation EditAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      id
      name
      born
    }
  }
`;
export const ADDED = gql`
  subscription BookAdded {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK}
`;
