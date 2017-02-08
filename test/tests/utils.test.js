import { expect } from 'chai'
import { describe, it } from 'mocha'

import { TransformError, validateSchema } from '../../lib/utils'

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
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })

  it('should fail if schema.data.links exists and is not a function', function () {
    const schema = { data: { links: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })

  it('should fail if schema.data.meta exists and is not a function', function () {
    const schema = { data: { meta: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })

  it('should fail if schema.data.attributes exists and is not a function', function () {
    const schema = { data: { attributes: 'foo' } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })

  it('should fail if schema.data.relationships exists and is not an object', function () {
    const schema = { data: { relationships() {} } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })

  it('should fail if a relationship key exists and its value is not a function', function () {
    const schema = { data: { relationships: { foo: 'bar' } } }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })

  it('should fail if schema.links exists and is not a function', function () {
    const schema = { links: 'foo' }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })

  it('should fail if schema.meta exists and is not a function', function () {
    const schema = { meta: 'foo' }
    expect(validateSchema.bind(null, { name: 'test', schema })).to.throw(Error)
  })
})
