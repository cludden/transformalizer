# transformalizer
a bare bones node module for building JSON API v1.0 compliant payloads.

this module makes no assumption regarding the shape of your data or the datastores/sdks used.



## Installing
```shell
$ npm install --save transformalizer
```



## Getting Started
Create a new transformalizer and register schemas
```javascript
import createTransformalizer from 'transformalizer'
import _ from 'lodash'

// create a new transformalizer
const transformalizer = createTransformalizer({ url: 'https://api.example.com' })

// register a schema
transformalizer.register({
  name: 'article',
  schema: {
    links({ source, options }) {
      if (Array.isArray(source)) {
        return { self: `${options.url}/articles` }
      }
      return undefined
    },
    meta({ source }) {
      if (Array.isArray(source)) {
        return { count: source.length }
      }
      return undefined
    },
    data: {
      type() {
        return 'article'
      },
      id({ data }) {
        return data.id
      },
      attributes({ data }) {
        return _(data)
        .pick('title', 'body', 'createdAt')
        .mapKeys((v, k) => _.snakeCase(k))
      },
      relationships: {
        author({ data, options, id }) {
          const { author } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/author`,
            related: `${options.url}/articles/${id}/author`,
          }
          if (!author) {
            return { links }
          }
          const included = _.isObject(author)
          return {
            data: {
              name: 'user',
              data: included ? author : { id: author },
              included,
            },
            links,
          }
        },
        comments({ data, options, id }) {
          const { comments } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/comments`,
            related: `${options.url}/articles/${id}/comments`,
          }
          if (!Array.isArray(comments) || !comments.length) {
            return { links }
          }
          const included = _.isObject(comments[0])
          return {
            data: comments.map(comment => ({
              name: 'comment',
              data: included ? comment : { id: comment },
              included,
            })),
            links,
          }
        }
      },
      links({ options, id }) {
        return { self: `${options.url}/articles/${id}` }
      }
    }
  }
})

// register related schemas
transformalizer.register({
  name: 'user',
  schema: {
    links({ source, options }) {
      if (Array.isArray(source)) {
        return { self: `${options.url}/users` }
      }
      return undefined
    },
    meta({ source }) {
      if (Array.isArray(source)) {
        return { count: source.length }
      }
      return undefined
    },
    data: {
      type() {
        return 'user'
      },
      id({ data }) {
        return data.id
      },
      attributes({ data }) {
        return _(data)
        .pick('firstName', 'lastName', 'email')
        .mapKeys((v, k) => _.snakeCase(k))
      },
      relationships: {
        articles({ data, options, id }) {
          const { articles } = data
          const links = {
            self: `${options.url}/users/${id}/relationships/articles`,
            related: `${options.url}/users/${id}/articles`,
          }
          if (!Array.isArray(articles) || !articles.length) {
            return { links }
          }
          const included = _.isObject(articles[0])
          return {
            data: articles.map(article => ({
              name: 'article',
              data: included ? article : { id: article },
              included,
            })),
            links,
          }
        },
        comments({ data, options, id }) {
          const { comments } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/comments`,
            related: `${options.url}/articles/${id}/comments`,
          }
          if (!Array.isArray(comments) || !comments.length) {
            return { links }
          }
          const included = _.isObject(comments[0])
          return {
            data: comments.map(comment => ({
              name: 'comment',
              data: included ? comment : { id: comment },
              included,
            })),
            links,
          }
        }
      },
      links({ options, id }) {
        return { self: `${options.url}/users/${id}` }
      }
    }
  }
})

transformalizer.register({
  name: 'comment',
  schema: {
    data: {
      type() {
        return 'comment'
      },
      id({ data }) {
        return data.id
      },
      attributes({ data }) {
        return _.pick(data, 'body')
      },
      relationships: {
        article({ data, options, id }) {
          const { article } = data
          const links = {
            self: `${options.url}/users/${id}/relationships/article`,
            related: `${options.url}/users/${id}/article`,
          }
          if (!article) {
            return { links }
          }
          const included = _.isObject(article)
          return {
            data: {
              name: 'article',
              data: included ? article : { id: article },
            },
            links,
          }
        },
        author({ data, options, id }) {
          const { author } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/author`,
            related: `${options.url}/articles/${id}/author`,
          }
          if (!author) {
            return { links }
          }
          const included = _.isObject(author)
          return {
            data: {
              name: 'user',
              data: included ? author : { id: author },
            },
            links,
          }
        }
      },
      links({ options, id }) {
        return { self: `${options.url}/comments/${id}` }
      }
    }
  }
})
```

Get a hold of some raw data
```javascript
const source = [
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
const document = transformalizer.transform({ name: 'article', source })
console.log(JSON.stringify(document))
```
which yields
```json
{
    "jsonapi": {
        "version": "1.0"
    },
    "links": {
        "self": "https://api.example.com/articles"
    },
    "meta": {
        "count": 2
    },
    "data": [
        {
            "type": "article",
            "id": "1",
            "attributes": {
                "body": "Hello, World!",
                "created_at": "2017-02-08T04:56:41.644Z"
            },
            "relationships": {
                "author": {
                    "data": {
                        "type": "user",
                        "id": "2"
                    },
                    "links": {
                        "self": "https://api.example.com/articles/1/relationships/author",
                        "related": "https://api.example.com/articles/1/author"
                    }
                },
                "comments": {
                    "data": [
                        {
                            "type": "comment",
                            "id": "1"
                        },
                        {
                            "type": "comment",
                            "id": "2"
                        }
                    ],
                    "links": {
                        "self": "https://api.example.com/articles/1/relationships/comments",
                        "related": "https://api.example.com/articles/1/comments"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/articles/1"
            }
        },
        {
            "type": "article",
            "id": "2",
            "attributes": {
                "body": "Hola, World!",
                "created_at": "2017-02-08T04:56:41.644Z"
            },
            "relationships": {
                "author": {
                    "data": {
                        "type": "user",
                        "id": "1"
                    },
                    "links": {
                        "self": "https://api.example.com/articles/2/relationships/author",
                        "related": "https://api.example.com/articles/2/author"
                    }
                },
                "comments": {
                    "data": [
                        {
                            "type": "comment",
                            "id": "3"
                        },
                        {
                            "type": "comment",
                            "id": "4"
                        }
                    ],
                    "links": {
                        "self": "https://api.example.com/articles/2/relationships/comments",
                        "related": "https://api.example.com/articles/2/comments"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/articles/2"
            }
        }
    ],
    "included": [
        {
            "type": "user",
            "id": "2",
            "attributes": {
                "first_name": "A$AP",
                "last_name": "Ferg",
                "email": "ferg@example.com"
            },
            "relationships": {
                "articles": {
                    "links": {
                        "self": "https://api.example.com/users/2/relationships/articles",
                        "related": "https://api.example.com/users/2/articles"
                    }
                },
                "comments": {
                    "links": {
                        "self": "https://api.example.com/articles/2/relationships/comments",
                        "related": "https://api.example.com/articles/2/comments"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/users/2"
            }
        },
        {
            "type": "comment",
            "id": "1",
            "attributes": {
                "body": "Nice article Ferg!"
            },
            "relationships": {
                "article": {
                    "data": {
                        "type": "article",
                        "id": "1"
                    },
                    "links": {
                        "self": "https://api.example.com/users/1/relationships/article",
                        "related": "https://api.example.com/users/1/article"
                    }
                },
                "author": {
                    "data": {
                        "type": "user",
                        "id": "1"
                    },
                    "links": {
                        "self": "https://api.example.com/articles/1/relationships/author",
                        "related": "https://api.example.com/articles/1/author"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/comments/1"
            }
        },
        {
            "type": "comment",
            "id": "2",
            "attributes": {
                "body": "Thanks Yeezy!"
            },
            "relationships": {
                "article": {
                    "data": {
                        "type": "article",
                        "id": "1"
                    },
                    "links": {
                        "self": "https://api.example.com/users/2/relationships/article",
                        "related": "https://api.example.com/users/2/article"
                    }
                },
                "author": {
                    "data": {
                        "type": "user",
                        "id": "2"
                    },
                    "links": {
                        "self": "https://api.example.com/articles/2/relationships/author",
                        "related": "https://api.example.com/articles/2/author"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/comments/2"
            }
        },
        {
            "type": "user",
            "id": "1",
            "attributes": {
                "first_name": "Kanye",
                "last_name": "West",
                "email": "kwest@example.com"
            },
            "relationships": {
                "articles": {
                    "links": {
                        "self": "https://api.example.com/users/1/relationships/articles",
                        "related": "https://api.example.com/users/1/articles"
                    }
                },
                "comments": {
                    "links": {
                        "self": "https://api.example.com/articles/1/relationships/comments",
                        "related": "https://api.example.com/articles/1/comments"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/users/1"
            }
        },
        {
            "type": "comment",
            "id": "3",
            "attributes": {
                "body": "First!"
            },
            "relationships": {
                "article": {
                    "data": {
                        "type": "article",
                        "id": "2"
                    },
                    "links": {
                        "self": "https://api.example.com/users/3/relationships/article",
                        "related": "https://api.example.com/users/3/article"
                    }
                },
                "author": {
                    "data": {
                        "type": "user",
                        "id": "2"
                    },
                    "links": {
                        "self": "https://api.example.com/articles/3/relationships/author",
                        "related": "https://api.example.com/articles/3/author"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/comments/3"
            }
        },
        {
            "type": "comment",
            "id": "4",
            "attributes": {
                "body": "nah man"
            },
            "relationships": {
                "article": {
                    "data": {
                        "type": "article",
                        "id": "2"
                    },
                    "links": {
                        "self": "https://api.example.com/users/4/relationships/article",
                        "related": "https://api.example.com/users/4/article"
                    }
                },
                "author": {
                    "data": {
                        "type": "user",
                        "id": "1"
                    },
                    "links": {
                        "self": "https://api.example.com/articles/4/relationships/author",
                        "related": "https://api.example.com/articles/4/author"
                    }
                }
            },
            "links": {
                "self": "https://api.example.com/comments/4"
            }
        }
    ]
}
```

## API

### createTransformalizer([options]) => transformalizer
Create a new transformalizer object

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| [options={}] | Object | global options shared between all schemas |

### transformalizer.register(params)

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.name | String | schema name |
| params.schema | Object | mappings for type, see [Schema](#schema) for more details |

### transformalizer.transform(params) => Object
Build a json api document using the schema with specified name and with the given source data.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.name | String | the name of the schema to use |
| params.source | Object|Object[] | source data |
| [params.options={}] | Object | additional data to be passed to transform functions, this will be merged with the global options |



## Schema
A schema object defines a set of functions used to transform your raw data into a valid JSON API document. It has the following basic structure (that closely resembles a json api document), which is described in more detail below
```
{
  links({ source, options, document }) => Object,
  meta({ source, options, document }) => Object,
  data: {
    type({ source, options, data }) => String,
    id({ source, options, data, type }) => String,
    attributes({ source, options, data, type, id }) => Object,
    relationships: {
      [rel]({ source, options, data, type, id, attributes }) => Object
    },
    links({ source, options, data, type, id, attributes, relationships }) => Object,
    meta({ source, options, data, type, id, attributes, relationships }) => Object
  }
}
```

### links(params) => Object
A function that should return the top level links object.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function, merged with the global options object |
| params.data | Object | the json api document data after transform |
| params.included | Object[] | the json api document included data after transform |

---

### meta(params) => Object
A function that should return the top level meta object.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function, merged with the global options object |
| params.data | Object | the json api document data after transform |
| params.included | Object[] | the json api document included data after transform |

---

### data.type(params) => String
A function that should return the type of the resource being processed. If this returns a type other than the schema type, the other schema will be used in place of the current schema.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function |
| params.data | Object | the current item being processed when source is an array, or the source itself if not an array |

---

### data.id(params) => String
A function that should return the id of the resource being processed.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function |
| params.data | Object | the current item being processed when source is an array, or the source itself if not an array |
| params.type | String | the resource type determined in the `data.type` step |

---

### data.attributes(params) => Object
A function that should return the attributes portion of the resource being processed. If a null or undefined value is returned, no attributes will be included on the resource.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function |
| params.data | Object | the current item being processed when source is an array, or the source itself if not an array |
| params.type | String | the resource type determined in the `data.type` step |
| params.id | String | the id of the current resource, determined in the `data.id` step |

---

### data.relationships.*key*(params) => Object
A map of relationship keys to functions that should return a valid [relationship object](http://jsonapi.org/format/#document-resource-object-relationships) with one caveat outlined below. If a null or undefined value is returned, that relationship will be excluded from the relationships object.

**Caveat:** The data property of the relationship object should either be a single object or an array of objects in the form shown below
```javascript
{
  name: 'schemaName', // the name of the related schema to use to transform the related item
  data: { /* the "data" param to be passed to the related schema's functions */ },
  included: true, // optional, required if the related item should be included
  meta: { /* a meta object to be included on the resource identifier object */ }
}
```

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function |
| params.data | Object | the current item being processed when source is an array, or the source itself if not an array |
| params.type | String | the resource type determined in the `data.type` step |
| params.id | String | the id of the current resource, determined in the `data.id` step |
| params.attributes | Object | the attributes object of the current resource, determined in the `data.attributes` step |

---

### data.links(params) => Object
A function that should return the links object for the current resource. If a null or undefined value is returned, no links will be included on the resource.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function |
| params.data | Object | the current item being processed when source is an array, or the source itself if not an array |
| params.type | String | the resource type determined in the `data.type` step |
| params.id | String | the id of the current resource, determined in the `data.id` step |
| params.attributes | Object | the attributes object of the current resource, determined in the `data.attributes` step |
| params.relationships | Object | the relationships object of the current resource, determined in the `data.relationships` step |

---

### data.meta(params) => Object
A function that should return the meta object for the current resource. If a null or undefined value is returned, no attributes will be included on the resource.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| params | Object | |
| params.source | Object[],Object | the source data passed to the #transform function |
| params.options | Object | any options passed to the #transform function |
| params.data | Object | the current item being processed when source is an array, or the source itself if not an array |
| params.type | String | the resource type determined in the `data.type` step |
| params.id | String | the id of the current resource, determined in the `data.id` step |
| params.attributes | Object | the attributes object of the current resource, determined in the `data.attributes` step |
| params.relationships | Object | the relationships object of the current resource, determined in the `data.relationships` step |
| params.links | Object | the links object of the current resource, determined in the `data.links` step |



## Test
Run the test suite
```shell
$ npm test
```

Run coverage
```shell
$ npm run coverage
```



## Contributing
1. [Fork it](https://github.com/GaiamTV/transformalizer/fork)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request



## License
Copyright (c) 2017 Gaia.
Licensed under the [MIT license](LICENSE.md).
