const { ApolloServer } = require('apollo-server')
const axios = require('axios')

// This is a (sample) collection of books we'll be able to query
// the GraphQL server for.  A more complete example might fetch
// from an existing data source like a REST API or database.
const restAPI = axios.create({
  method: 'get',
  baseURL: 'http://json-server',
})
function getData(url) {
  return restAPI.get(url).then(({ data }) => data)
}

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDefs = require('./typeDefs')

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
  Query: {
    db: () => getData('/db'),
    todo: (parent, args, ctx) => getData(`/todos/${args.id}`),
    todos: () => getData('/todos'),
    user: (parent, args, ctx) => getData(`/users/${args.id}`),
    users: () => getData('/users'),
    photo: (parent, args, ctx) => getData(`/photos/${args.id}`),
    photos: () => getData('/photos'),
    album: (parent, args, ctx) => getData(`/albums/${args.id}`),
    albums: () => getData('/albums'),
    comment: (parent, args, ctx) => getData(`/comments/${args.id}`),
    comments: () => getData('/comments'),
    post: (parent, args, ctx) => getData(`/posts/${args.id}`),
    posts: () => getData('/posts'),
  },
}

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({ typeDefs, resolvers })

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
