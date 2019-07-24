import {
  queries as cartQueries,
} from './cart'

export const resolvers = {
  Query: {
    ...cartQueries,
  },
}
