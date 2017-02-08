import clone from 'clone'

/**
 * isFunction borrowed from underscore.js
 * @param  {*} object
 * @return {Boolean}
 * @private
 */
function isFunction(object) {
  return !!(object && object.constructor && object.call && object.apply)
}

function isString(val) {
  return typeof val === 'string'
}

/**
 * Determine if a variable is plain old javascript object (non array, non null, non date)
 * @param  {*} object
 * @return {Boolean}
 */
function isObject(object) {
  return object && typeof object === 'object' && !Array.isArray(object) && !(object instanceof Date)
}

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
    if (!isString(name)) {
      throw new Error('Invalid "name" Property (non string)')
    }
    registry[name] = {
      schema: validateSchema({ name, schema }),
      options: schemaOptions,
    }
    return undefined
  }

  /**
   * Transform raw data into a valid JSON API document
   * @param  {Object} args
   * @param  {String} args.name - the top level schema name
   * @param  {Object|Object[]} args.source - a single source object or an aray of source objects
   * @param  {Object} [options={}] - function level options
   * @return {Object} document
   */
  function transform({ name, source, options: opts }) {
    const docSchema = registry[name]
    if (!docSchema) {
      throw new Error(`Missing Schema: ${name}`)
    }
    const include = createInclude({ source, options: opts })
    const data = transformSource({ docSchema, source, options: opts, include })
    const included = include.get()
    const document = {
      jsonapi: {
        version: '1.0',
      },
      data,
    }
    if (included.length) {
      document.included = included
    }
    return document
  }

  /**
   * Transform source into the "primary data" of the document
   * @param  {Object} args
   * @param  {Object} args.docSchema - the top level schema used for transforming the document
   * @param  {Object|Object[]} args.source - source data
   * @param  {Object} args.options - function level options
   * @param  {Object} args.include - include object
   * @return {Object|Object[]}
   */
  function transformSource(args) {
    const { docSchema, source, options: opts, include } = args
    // TODO define include
    if (Array.isArray(source)) {
      return source.map(data => transformData({ docSchema, source, options: opts, data, include }))
    }
    return transformData({ docSchema, source, options: opts, data: source, include })
  }

  /**
   * Transform a single source object into a valid resource object
   * @param  {Object} arg
   * @param  {Object} args.docSchema - the top level schema used for transforming the document
   * @param  {Object|Object[]} args.source - source data
   * @param  {Object} args.options - function level options
   * @param  {Object} args.data - current source object
   * @param  {Object} args.include - include object
   * @param  {String} [args._type] - (for use by transformRelationshipData)
   * @param  {String} [args._id] - (for use by transformRelationshipData)
   * @return {Object}
   */
  function transformData(args) {
    const { docSchema, source, options: opts, data, include, _type, _id } = args
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
    const options = clone(Object.assign({}, baseOptions, opts))
    const params = { dataSchema, source, options, data }
    const type = params.type = _type || getType(params)
    const id = params.id = _id || getId(params)
    const attributes = params.attributes = getAttributes(params)
    const relationships = params.relationships = getRelationships({ include, ...params })
    const links = params.links = getLinks(params)
    const meta = params.meta = getMeta(params)
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
   * Get the resource type for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @return {String} type
   * @private
   */
  function getType(args) {
    const { dataSchema, ...others } = args
    const type = dataSchema.schema.data.type(others)
    if (!isString(type)) {
      throw new TransformError('Invalid type', args)
    }
    return type
  }

  /**
   * Get the resource id for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @return {String} id
   * @private
   */
  function getId(args) {
    const { dataSchema, ...others } = args
    const id = dataSchema.schema.data.id(others)
    if (!isString(id)) {
      throw new TransformError('Invalid id', args)
    }
    return id
  }

  /**
   * Get the resource attributes object for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @return {Object} attributes
   * @private
   */
  function getAttributes(args) {
    const { dataSchema, ...others } = args
    const attributes = dataSchema.schema.data.attributes(others)
    return attributes
  }

  /**
   * Get the resource relationships object for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.include
   * @return {Object} relationships
   * @private
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
   * Get the resource relationship object for the current relationship of the
   * current source object
   * @param  {Object} args
   * @param  {Object} args.fn
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.include
   * @return {Object} relationship
   * @private
   */
  function getRelationship(args) {
    const { fn, include, ...others } = args
    const result = fn(others)
    if (!isObject(result)) {
      return undefined
    }
    const { meta, links, data } = result
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
          include,
        }))
      } else {
        relationship.data = transformRelationshipData({
          item: data,
          source: args.source,
          options: args.options,
          include,
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
   * Get the data for the current relationship object for the current source
   * object
   * @param  {Object} args
   * @param  {Object} args.item - the current data item
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Function} args.include
   * @return {Object} data
   * @private
   */
  function transformRelationshipData(args) {
    const { item, source, options, include } = args
    const { name, data, included, meta, links } = item
    if (!isString(name) || !registry[name]) {
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
    if (included === true && !include.exists({ type, id })) {
      const resource = transformData({
        docSchema: relSchema,
        source,
        options,
        data,
        include,
        _type: type,
        _id: id,
      })
      include.include(resource)
    }
    return result
  }

  /**
   * Get the resource links for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.relationships
   * @return {Object} links
   * @private
   */
  function getLinks(args) {
    const { dataSchema, ...others } = args
    if (dataSchema.schema.data.links) {
      return dataSchema.schema.data.links(others)
    }
    return undefined
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.relationships
   * @param  {Object} args.links
   * @return {Object} meta
   * @private
   */
  function getMeta(args) {
    const { dataSchema, ...others } = args
    if (dataSchema.schema.data.meta) {
      return dataSchema.schema.data.meta(others)
    }
    return undefined
  }

  /**
   * Create an include object
   * @return {Object} include
   * @private
   */
  function createInclude() {
    const included = []
    const alreadyIncluded = {}
    return {
      exists({ type, id }) {
        return alreadyIncluded[`${type}:${id}`]
      },

      include(resource) {
        alreadyIncluded[`${resource.type}:${resource.id}`] = true
        included.push(resource)
      },

      get() {
        return included
      },
    }
  }

  return {
    register,
    transform,
  }
}


/**
 * Transform Error Constructor
 * @param {String} msg
 * @param {Object} args
 */
export function TransformError(msg, args) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = msg
  this.args = args
}

/**
 * Validate a schema definition
 * @param  {Object} args
 * @param  {String} args.name - schema name/id
 * @param  {Object} args.schema - schema definition
 * @return {Object} validated
 * @private
 */
function validateSchema({ name, schema }) {
  if (!isObject(schema) || !schema.data) {
    throw new Error('Invalid "schema" Property')
  }
  if (!isObject(schema.data)) {
    throw new Error('Invalid "schema.data" Property')
  }
  // validate id
  if (!isFunction(schema.data.id)) {
    schema.id = ({ id }) => id
  }
  // validate type
  if (!isFunction(schema.data.type)) {
    schema.type = function type() { return name }
  }
  if (schema.data.links && !isFunction(schema.data.links)) {
    throw new Error('Invalid "schema.data.links" Property')
  }
  if (schema.data.meta && !isFunction(schema.data.meta)) {
    throw new Error('Invalid "schema.data.meta" Property')
  }
  // validate attributes
  if (schema.data.attributes && !isFunction(schema.data.attributes)) {
    throw new Error('Invalid "schema.data.attributes" Property')
  }
  // validate relationships
  if (schema.data.relationships) {
    if (!isObject(schema.data.relationships)) {
      throw new Error('Invalid "schema.data.relationships" Property')
    } else {
      Object.keys(schema.data.relationships).forEach((rel) => {
        if (!isFunction(schema.data.relationships[rel])) {
          throw new Error(`Invalid Schema: Relationship "${rel}" should be a function`)
        }
      })
    }
  }
  if (schema.links && !isFunction(schema.links)) {
    throw new Error('Invalid "schema.links" Property')
  }
  if (schema.meta && !isFunction(schema.meta)) {
    throw new Error('Invalid "schema.meta" Property')
  }
  return schema
}
