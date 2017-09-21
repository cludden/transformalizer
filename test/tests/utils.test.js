import { expect } from 'chai'
import { describe, it } from 'mocha'

import { TransformError, validateSchema, validateJsonApiDocument } from '../../lib/utils'

describe('TransformError', function () {
  it('should be instanceof Error', function () {
    const err = new TransformError('blah', {})
    expect(err).to.be.instanceof(Error)
  })
})

describe('validateSchema', function () {
  it('should validate empty schema', function () {
    const schema = validateSchema({ name: 'test' })
    expect(schema).to.be.an('object')
    expect(schema).to.have.property('data').that.is.an('object')
    expect(schema.data).to.have.property('type').that.is.a('function')
    expect(schema.data).to.have.property('id').that.is.a('function')
    expect(schema.data.type()).to.equal('test')
    expect(schema.data.id({ data: { id: 1 } })).to.equal('1')
  })

  it('should fail if schema is not an object', function () {
    const schema = 'foo'
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema" Property')
  })

  it('should fail if schema.data.untransformDataSchema exists and is not a function', function () {
    const schema = { data: { untransformDataSchema: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.data.untransformDataSchema" Property')
  })

  it('should fail if schema.data.untransformId exists and is not a function', function () {
    const schema = { data: { untransformId: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.data.untransformId" Property')
  })

  it('should fail if schema.data.links exists and is not a function', function () {
    const schema = { data: { links: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.data.links" Property')
  })

  it('should fail if schema.data.meta exists and is not a function', function () {
    const schema = { data: { meta: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.data.meta" Property')
  })

  it('should fail if schema.data.attributes exists and is not a function', function () {
    const schema = { data: { attributes: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.data.attributes" Property')
  })

  it('should fail if schema.data.untransformAttributes exists and is not a function', function () {
    const schema = { data: { untransformAttributes: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.data.untransformAttributes" Property')
  })

  it('should fail if schema.data.relationships exists and is not an object', function () {
    const schema = { data: { relationships() {} } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.data.relationships" Property')
  })

  it('should fail if a relationship key exists and its value is not a function', function () {
    const schema = { data: { relationships: { foo: 'bar' } } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid Schema: Relationship "foo" should be a function')
  })

  it('should fail if schema.links exists and is not a function', function () {
    const schema = { links: 'foo' }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.links" Property')
  })

  it('should fail if schema.meta exists and is not a function', function () {
    const schema = { meta: 'foo' }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw('Invalid "schema.meta" Property')
  })
})

describe('validateJsonApiDocument', function () {
  const documentTemplate = {
    data: {
      id: '1',
      type: 'article',
      attributes: {
        title: 'JSON-API validation requirements',
        content: 'JSON-API validation requires ...',
      },
      relationships: {
        author: {
          data: {
            id: '1',
            type: 'author',
          },
        },
      },
    },
    included: [
      {
        id: '1',
        type: 'author',
        attributes: {
          firstName: 'John',
          lastName: 'Doe',
        },
        relationships: {
          contactInfo: {
            data: [
              {
                id: '1',
                type: 'contactInformation',
              },
            ],
          },
        },
      },
      {
        id: '1',
        type: 'contactInformation',
        attributes: {
          phone: '555-123-4567',
          email: 'john.doe@localhost.com',
        },
      },
    ],
    links: {
      self: 'http://localhost:80/',
    },
    meta: {
      license: 'MIT',
    },
  }

  it('should succeed if the JSON-API document is valid', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    expect(validateJsonApiDocument.bind(null, document)).to.not.throw()
  })

  it('should fail if the JSON-API document is not an object', function () {
    const document = JSON.stringify(documentTemplate)
    expect(validateJsonApiDocument.bind(null, document)).to.throw('JSON-API document must be an object')
  })

  it('should fail if the JSON-API document is missing the primary top level fields', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    delete document.data
    delete document.meta

    expect(validateJsonApiDocument.bind(null, document)).to.throw('JSON-API document must contain at least one of "data", "errors", or "meta"')
  })

  it('should fail if the JSON-API document contains both "data" and "errors" fields', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    document.errors = [{ detail: 'Article 1 does not exist' }]

    expect(validateJsonApiDocument.bind(null, document)).to.throw('JSON-API document must not contain both "data" and "errors"')
  })

  it('should fail if the JSON-API document contains "included" field but not "data" field', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    delete document.data

    expect(validateJsonApiDocument.bind(null, document)).to.throw('JSON-API document cannot contain "included" without "data"')
  })

  it('should fail if the JSON-API document primary data resource id is not a string', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    document.data.id = 1

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Primary data resource id "${document.data.id}" must be a string`)
  })

  it('should fail if the JSON-API document primary data resource type is missing', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    delete document.data.type

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Primary data resource "${document.data.id}" must have a "type" field`)
  })

  it('should fail if the JSON-API document primary data resource type is not a string', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    document.data.type = 1

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Primary data resource type "${document.data.type}" must be a string`)
  })

  it('should fail if the JSON-API document primary data resource attributes is not an object', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    document.data.attributes = "{title: 'JSON-API validation requirements'}"

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Primary data resource "${document.data.id}, ${document.data.type}" field "attributes" must be an object`)
  })

  it('should fail if the JSON-API document primary data resource relationships is not an object', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    document.data.relationships = '{author: {data: {id: 1, type: author}}}'

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Primary data resource "${document.data.id}, ${document.data.type}" field "relationships" must be an object`)
  })

  it('should fail if the JSON-API document primary data resource relationship data is missing', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    delete document.data.relationships.author.data

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Relationship "author" of primary data resource "${document.data.id}, ${document.data.type}" must have a "data" field`)
  })

  it('should fail if the JSON-API document primary data resource relationship id is missing', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    delete document.data.relationships.author.data.id

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Data of relationship "author" of primary data resource "${document.data.id}, ${document.data.type}" must have an "id" field`)
  })

  it('should fail if the JSON-API document primary data resource relationship id is not a string', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    document.data.relationships.author.data.id = 1

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Data "${document.data.relationships.author.data.id}" of relationship "author" of primary data resource "${document.data.id}, ${document.data.type}" must be a string`)
  })

  it('should fail if the JSON-API document primary data resource relationship type is missing', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    delete document.data.relationships.author.data.type

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Data "${document.data.relationships.author.data.id}" of relationship "author" of primary data resource "${document.data.id}, ${document.data.type}" must have a "type" field`)
  })

  it('should fail if the JSON-API document primary data resource relationship type is not a string', function () {
    const document = JSON.parse(JSON.stringify(documentTemplate))
    document.data.relationships.author.data.type = 1

    expect(validateJsonApiDocument.bind(null, document)).to.throw(`Type "${document.data.relationships.author.data.type}" of relationship "author" of primary data resource "${document.data.id}, ${document.data.type}" must be a string`)
  })
})
