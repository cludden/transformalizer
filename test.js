export default [
  {
    id: 1,
    body: 'Hello, World!',
    createdAt: '2017-02-08T04:56:41.644Z',
    author: {
      id: 2,
      firstName: 'A$AP',
      lastName: 'Ferg',
      email: 'ferg@example.com',
    },
    comments: [
      {
        author: {
          id: 1,
          firstName: 'Kanye',
          lastName: 'West',
          email: 'kwest@example.com',
        },
        id: 1,
        body: 'Nice article Ferg!',
        article: 1,
      },
      {
        author: {
          id: 2,
          firstName: 'A$AP',
          lastName: 'Ferg',
          email: 'ferg@example.com',
        },
        id: 2,
        body: 'Thanks Yeezy!',
        article: 1,
      },
    ],
  },
  {
    id: 2,
    body: 'Hola, World!',
    createdAt: '2017-02-08T04:56:41.644Z',
    author: {
      id: 1,
      firstName: 'Kanye',
      lastName: 'West',
      email: 'kwest@example.com',
    },
    comments: [
      {
        author: {
          id: 2,
          firstName: 'A$AP',
          lastName: 'Ferg',
          email: 'ferg@example.com',
        },
        id: 3,
        body: 'First!',
        article: 2,
      },
      {
        author: {
          id: 1,
          firstName: 'Kanye',
          lastName: 'West',
          email: 'kwest@example.com',
        },
        id: 4,
        body: 'nah man',
        article: 2,
      },
    ],
  },
]
