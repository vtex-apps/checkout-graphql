import {
  mutations as cartMutations,
  queries as cartQueries,
} from './cart'

export const resolvers = {
  Mutation: {
    ...cartMutations,
  },
  Query: {
    ...cartQueries,
  },
}
