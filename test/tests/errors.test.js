import { expect } from 'chai'
import { describe, it } from 'mocha'

import createTransformalizer from '../../lib/transformalizer'

describe('errors and coverage', function () {
  describe('#register', function () {
    it('should throw if the name is invalid', function () {
      const transformalizer = createTransformalizer()
      expect(transformalizer.register.bind(null, {})).to.throw(Error)
    })
  })

  describe('#transform', function () {
    const transformalizer = createTransformalizer()
    transformalizer.register({ name: 'foo' })

    it('should throw if the name is invalid', function () {
      expect(transformalizer.transform.bind(null, {})).to.throw(Error)
    })

    it('should throw if the schema does not exist', function () {
      expect(transformalizer.transform.bind(null, { name: 'missing' })).to.throw(Error)
    })

    it('should throw if type returns a non string', function () {
      const schema = { data: { type() { return false } } }
      transformalizer.register({ name: 'invalid-type', schema })
      expect(transformalizer.transform.bind(null, { name: 'invalid-type', source: {} })).to.throw(Error)
    })

    it('should throw if id returns a non string', function () {
      const schema = { data: { id() { return false } } }
      transformalizer.register({ name: 'invalid-id', schema })
      expect(transformalizer.transform.bind(null, { name: 'invalid-id', source: {} })).to.throw(Error)
    })

    it('should skip attributes if they return a non object', function () {
      const schema = {
        data: {
          attributes({ data }) {
            if (data.skip) {
              return undefined
            }
            return { _id: data.id }
          },
        },
      }
      transformalizer.register({ name: 'no-attributes', schema })
      expect(transformalizer.transform({ name: 'no-attributes', source: { id: 1 } }))
      .to.have.deep.property('data.attributes')
      .that.is.an('object')
      expect(transformalizer.transform({ name: 'no-attributes', source: { id: 1, skip: true } }))
      .to.not.have.deep.property('data.attributes')
    })

    it('should skip a relationship if it returns a non object', function () {
      const schema = {
        data: {
          attributes({ data }) {
            if (data.skip) {
              return undefined
            }
            return { _id: data.id }
          },
          relationships: {
            thing({ data }) {
              if (!data.thing) {
                return undefined
              }
              return {
                data: {
                  name: 'no-relationships',
                  data: data.thing,
                },
              }
            },
          },
        },
      }
      transformalizer.register({ name: 'no-relationships', schema })
      expect(transformalizer.transform({ name: 'no-relationships', source: { id: 1 } }))
      .to.not.have.deep.property('data.relationships')
      expect(transformalizer.transform({ name: 'no-relationships', source: { id: 1, thing: { id: 1 } } }))
      .to.have.deep.property('data.relationships').with.all.keys('thing')
    })

    it('should skip a relationship if it returns an empty or invalid object', function () {
      const schema = {
        data: {
          attributes({ data }) {
            if (data.skip) {
              return undefined
            }
            return { _id: data.id }
          },
          relationships: {
            thing() {
              return {}
            },
          },
        },
      }
      transformalizer.register({ name: 'no-relationships', schema })
      expect(transformalizer.transform({ name: 'no-relationships', source: { id: 1 } }))
      .to.not.have.deep.property('data.relationships')
    })

    it('should skip a relationship if it returns invalid data only', function () {
      const schema = {
        data: {
          attributes({ data }) {
            if (data.skip) {
              return undefined
            }
            return { _id: data.id }
          },
          relationships: {
            thing() {
              return {
                data: 1,
              }
            },
          },
        },
      }
      transformalizer.register({ name: 'invalid-relationship-data', schema })
      expect(transformalizer.transform({ name: 'invalid-relationship-data', source: { id: 1 } }))
      .to.not.have.deep.property('data.relationships')
    })

    it('should support relationship meta', function () {
      const schema = {
        data: {
          attributes({ data }) {
            if (data.skip) {
              return undefined
            }
            return { _id: data.id }
          },
          relationships: {
            thing() {
              return {
                data: {
                  name: 'relationship-meta',
                  data: { id: 2 },
                },
                meta: {
                  count: 1,
                },
              }
            },
          },
        },
      }
      transformalizer.register({ name: 'relationship-meta', schema })
      expect(transformalizer.transform({ name: 'relationship-meta', source: { id: 1 } }))
      .to.have.deep.property('data.relationships.thing.meta.count')
    })

    it('should throw if relationship data includes a missing schema name', function () {
      const schema = {
        data: {
          attributes({ data }) {
            if (data.skip) {
              return undefined
            }
            return { _id: data.id }
          },
          relationships: {
            thing() {
              return {
                data: {
                  name: 'unknown',
                  data: { id: 2 },
                },
              }
            },
          },
        },
      }
      transformalizer.register({ name: 'unknown-relationship-name', schema })
      expect(transformalizer.transform.bind(null, { name: 'unknown-relationship-name', source: { id: 1 } }))
      .to.throw(Error)
    })

    it('should throw if relationship data includes an invalid schema name', function () {
      const schema = {
        data: {
          attributes({ data }) {
            if (data.skip) {
              return undefined
            }
            return { _id: data.id }
          },
          relationships: {
            thing() {
              return {
                data: {
                  name: 1,
                  data: { id: 2 },
                },
              }
            },
          },
        },
      }
      transformalizer.register({ name: 'invalid-relationship-name', schema })
      expect(transformalizer.transform.bind(null, { name: 'invalid-relationship-name', source: { id: 1 } }))
      .to.throw(Error)
    })

    it('should throw not throw if no attributes hook present', function () {
      transformalizer.register({ name: 'transform-no-attributes' })
      expect(transformalizer.transform.bind(null, { name: 'transform-no-attributes', source: { id: 1 } }))
      .to.not.throw(Error)
    })
  })
})
