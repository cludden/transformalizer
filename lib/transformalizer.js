/* eslint no-use-before-define: off */
import Bluebird from 'bluebird'
import R from 'ramda'

const isFunction = R.is(Function)
const isObject = R.and(R.is(Object), x => !Array.isArray(x))

export default function createTransformalizer(baseOptions) {
  const registry = {}

  /**
   * Register a schema
   * @param  {Object} args
   * @param  {String} args.name - schema name/id
   * @param  {Object} args.schema - schema definition
   * @param  {Object} [args.options={}] - schema options to be merged in to transform options
   * @return {Undefined}
   */
  function register({ name, schema, options: schemaOptions }) {
    if (!R.is(String, name)) {
      throw new Error('Invalid "name" Property (non string)')
    }
    registry[name] = {
      schema: validateSchema(name, schema),
      options: schemaOptions,
    }
    return undefined
  }

  /**
   * Transform raw data into a valid JSON API document
   * @param  {Object} args
   * @param  {String} args.name - the top level schema name
   * @param  {Object|Object[]} args.source - source data
   * @param  {Object} [options={}] - function level options
   * @return {Object} document
   */
  function transform({ name, source, options: opts }) {
    const docSchema = registry[name]
    if (!docSchema) {
      throw new Error(`Missing Schema: ${name}`)
    }
    const include = function _include() {}
    const data = transformSource({ docSchema, source, options: opts, include })
    // process source
    // process included
    // process top level links
    // process top level meta
    return {
      jsonapi: {
        version: '1.0',
      },
      data,
    }
  }

  function transformSource({ docSchema, source, options: opts, include }) {
    // TODO define include
    if (Array.isArray(source)) {
      return source.map(data => transformData({ docSchema, source, options: opts, data, include }))
    }
    return transformData({ docSchema, source, options: opts, data: source, include })
  }

  function transformData({ docSchema, source, options: opts, data, include }) {
    // call dataSchema if defined and switch contexts if necessary
    let dataSchema = docSchema
    if (isFunction(docSchema.schema.data.dataSchema)) {
      const name = docSchema.schema.data.dataSchema({ source, data, options: opts })
      if (name !== docSchema.name) {
        dataSchema = registry[name]
        if (!dataSchema) {
          throw new Error(`Missing Schema: ${name}`)
        }
      }
    }
    const options = R.clone(R.mergeAll([{}, baseOptions, dataSchema.options, opts]))
    const args = { dataSchema, source, options, data }
    const type = args.type = getType(args)
    const id = args.id = getId(args)
    const attributes = args.attributes = getAttributes(args)
    const relationships = args.relationships = getRelationships({ include, ...args })
    const links = args.links = getLinks(args)
    const meta = args.meta = getMeta(args)
    // build resulting resource
    const resource = { type, id }
    if (isObject(attributes)) {
      resource.attributes = attributes
    }
    if (isObject(relationships)) {
      resource.relationships = relationships
    }
    if (isObject(meta)) {
      resource.meta = meta
    }
    if (isObject(links)) {
      resource.links = links
    }
    return resource
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @return {String} type
   */
  function getType(args) {
    const { dataSchema, ...others } = args
    const type = dataSchema.schema.data.type(others)
    if (!R.is(String, type)) {
      throw new TransformError('Invalid type', args)
    }
    return type
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @return {String} type
   */
  function getId(args) {
    const { dataSchema, ...others } = args
    const id = dataSchema.schema.data.id(others)
    if (!R.is(String, id)) {
      throw new TransformError('Invalid id', args)
    }
    return id
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @return {String} type
   */
  function getAttributes(args) {
    const { dataSchema, ...others } = args
    const attributes = dataSchema.schema.data.attributes(others)
    return attributes
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.include
   * @return {String} type
   */
  function getRelationships(args) {
    const { dataSchema, ...others } = args
    const relSchema = dataSchema.schema.data.relationships
    if (relSchema) {
      const keys = Object.keys(relSchema)
      return keys.reduce((memo, key) => {
        const fn = relSchema[key]
        const relationship = getRelationship({ fn, ...others })
        if (isObject(relationship)) {
          memo[key] = relationship
        }
        return memo
      }, {})
    }
    return undefined
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.fn
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.include
   * @return {String} type
   */
  function getRelationship(args) {
    const { fn, ...others } = args
    const result = fn(others)
    const { meta, links, data } = R.pickAll(['meta', 'links', 'data'], result)
    if (!links && !meta && !data) {
      return undefined
    }
    const relationship = {}
    if (data && typeof data === 'object') { // ensure its an array or object
      if (Array.isArray(data)) {
        relationship.data = data.map(item => transformRelationshipData({
          item,
          source: args.source,
          options: args.options,
        }))
      } else {
        relationship.data = transformRelationshipData({
          item: data,
          source: args.source,
          options: args.options,
        })
      }
    }
    if (isObject(meta)) {
      relationship.meta = meta
    }
    if (isObject(links)) {
      relationship.links = links
    }
    return relationship
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.item
   * @param  {*} args.source
   * @param  {*} args.options
   * @return {String} type
   */
  function transformRelationshipData(args) {
    const { item, source, options } = args
    const { name, data, meta, links } = item
    if (!R.is(String, name) || !registry[name]) {
      throw new TransformError(`Missing Schema: ${name}`, args)
    }
    if (!data) {
      throw new TransformError('Missing Relationship Data', args)
    }
    const relSchema = registry[name]
    const type = getType({ dataSchema: relSchema, source, options, data })
    const id = getId({ dataSchema: relSchema, source, options, data })
    const result = { type, id }
    if (isObject(meta)) {
      result.meta = meta
    }
    if (isObject(links)) {
      result.links = links
    }
    return result
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.relationships
   * @return {String} type
   */
  function getLinks(args) {

  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.relationships
   * @param  {*} args.links
   * @return {String} type
   */
  function getMeta() {

  }

  return {
    register,
    transform,
  }
}

function TransformError(msg, args) {
  Error.captureStackTrace(this, TransformError)
  this.message = msg
  this.args = args
}

/**
 * Validate a schema definition
 * @param  {Object} args
 * @param  {String} args.name - schema name/id
 * @param  {Object} schema - schema definition
 * @return {Object} validated
 */
export function validateSchema({ name, schema }) {
  if (!isObject(schema)) {
    throw new Error('Invalid "schema" Property (non object)')
  }
  // validate id
  if (!isFunction(schema.id)) {
    schema.id = R.prop('id')
  }
  // validate type
  if (!isFunction(schema.type)) {
    schema.type = R.always(name)
  }
  // validate attributes
  if (!isFunction(schema.attributes)) {
    throw new Error('Invalid Schema: Missing "attributes" Hook')
  }
  // validate relationships
  if (schema.relationships && !isObject(schema.relationships)) {
    throw new Error('Invalid Schema: Invalid "relationships" Hook')
  }
  Object.keys(schema.relationships).forEach((rel) => {
    if (!isFunction(schema.relationships[rel])) {
      throw new Error(`Invalid Schema: Relationship "${rel}" should be a function`)
    }
  })
  const optionalProperties = ['links', 'meta', 'topLevelLinks', 'topLevelMeta']
  optionalProperties.forEach((prop) => {
    if (schema[prop] && !isFunction(schema[prop])) {
      throw new Error(`Invalid Schema: Invalid "${prop}" Hook`)
    }
  })
}
