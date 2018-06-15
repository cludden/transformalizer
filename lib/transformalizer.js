import {
  isFunction,
  isObject,
  isString,
  TransformError,
  validateSchema,
  validateJsonApiDocument,
} from './utils'

/**
 * Transformalizer factory function.
 * @param  {Object} [baseOptions={}]
 * @return {Object} transformalizer
 */
export default function createTransformalizer(baseOptions = {}) {
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
   * Get a schema from the registry by name
   * @param  {String} options.name - schema name/id
   * @return {Object}              - schema
   */
  function getSchema({ name }) {
    return registry[name]
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
    if (!isString(name)) {
      throw new TransformError(`Invalid "name" Property (non string) actual type: '${typeof name}'`, { name, source, options: opts })
    }
    const docSchema = registry[name]
    if (!docSchema) {
      throw new TransformError(`Missing Schema: ${name}`, { name, source, options: opts })
    }
    const options = Object.assign({}, baseOptions, opts)
    const include = createInclude({ source, options })
    const data = transformSource({ docSchema, source, options, include })
    const included = include.get()
    const document = {
      jsonapi: {
        version: '1.0',
      },
    }
    // add top level properties if available
    const topLevel = ['links', 'meta']
    topLevel.forEach((prop) => {
      if (docSchema.schema[prop]) {
        const result = docSchema.schema[prop]({ source, options, data, included })
        if (isObject(result)) {
          document[prop] = result
        }
      }
    })
    document.data = data
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
    const { docSchema, source, options, data, include, _type, _id } = args
    // call dataSchema if defined and switch contexts if necessary
    let dataSchema = docSchema
    if (isFunction(docSchema.schema.data.dataSchema)) {
      const name = docSchema.schema.data.dataSchema({ source, data, options })
      if (name !== docSchema.name) {
        dataSchema = registry[name]
        if (!dataSchema) {
          throw new Error(`Missing Schema: ${name}`)
        }
      }
    }
    const state = {}
    const params = { dataSchema, source, options, data, state }
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
      throw new TransformError(`Invalid type, expected string but is '${typeof type}'. `, args)
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
      throw new TransformError(`Invalid type, expected string but is '${typeof id}'.`, args)
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
    if (dataSchema.schema.data.attributes) {
      const attributes = dataSchema.schema.data.attributes(others)
      return attributes
    }
    return undefined
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
      const relationships = keys.reduce((memo, key) => {
        const fn = relSchema[key]
        const relationship = getRelationship({ fn, ...others })
        if (isObject(relationship)) {
          memo[key] = relationship
        }
        return memo
      }, {})
      if (!Object.keys(relationships).length) {
        return undefined
      }
      return relationships
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
    const invalidData = (typeof data === 'undefined' || typeof data !== 'object')
    if (!links && !meta && invalidData) {
      return undefined
    }
    const relationship = {}
    if (!invalidData) {
      if (Array.isArray(data)) {
        relationship.data = data.map(item => transformRelationshipData({
          item,
          source: args.source,
          options: args.options,
          include,
        }))
      } else if (data === null) {
        relationship.data = null
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
    const { name, data, included, meta } = item
    if (!isString(name) || !registry[name]) {
      throw new TransformError(`Missing Schema: ${name}`, args)
    }
    const relSchema = registry[name]
    const type = getType({ dataSchema: relSchema, source, options, data })
    const id = getId({ dataSchema: relSchema, source, options, data })
    const result = { type, id }
    if (isObject(meta)) {
      result.meta = meta
    }

    if (included === true && !include.exists({ type, id })) {
      include.markAsIncluded({ type, id })

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
   * Get the resource meta for the current source object
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
      /**
       * Determine whether or not a given resource has already been included
       * @param {Object} args
       * @param {String} args.type
       * @param {String} args.id
       * @return {Boolean}
       */
      exists({ type, id }) {
        return alreadyIncluded[`${type}:${id}`]
      },

      /**
       * Mark a resource as included
       * @param {Object} args
       * @param {String} args.type
       * @param {String} args.id
       * @return {Undefined}
       */
      markAsIncluded: function markAsIncluded({ type, id }) {
        alreadyIncluded[`${type}:${id}`] = true
      },

      /**
       * Add an included resource to the included section of the document
       * @param {Object} resource
       * @return {Undefined}
       */
      include(resource) {
        included.push(resource)
      },

      /**
       * Return the included array in its current state
       * @return {Object[]}
       */
      get() {
        return included
      },
    }
  }

  /**
   * Untransform a valid JSON API document into raw data
   * @param  {Object} args
   * @param  {Object} args.document - a json-api formatted document
   * @param  {Object} [options={}] - function level options
   * @return {Object[]} an array of data objects
   */
  function untransform({ document, options: opts }) {
    // validate json api document
    validateJsonApiDocument(document)

    const options = Object.assign({}, baseOptions, opts)
    const data = {}
    const resourceDataMap = []

    if (Array.isArray(document.data)) {
      document.data.forEach(resource => untransformResource({ resource, data, resourceDataMap, document, options }))
    } else {
      untransformResource({ resource: document.data, data, resourceDataMap, document, options })
    }

    const primaryDataObjects = resourceDataMap.map(mapping => mapping.object)

    // untransform included resources if desired
    if (options.untransformIncluded && document.included) {
      document.included.forEach(resource => untransformResource({ resource, data, resourceDataMap, document, options }))
    }

    // nest included resources if desired
    if (options.nestIncluded) {
      resourceDataMap.forEach(resourceDataMapping => nestRelatedResources({ resourceDataMapping, data, options }))

      // remove circular dependencies if desired
      if (options.removeCircularDependencies) {
        const processed = new WeakSet()
        const visited = new WeakSet()

        removeCircularDependencies({ object: { root: primaryDataObjects }, processed, visited })
      }
    }

    return data
  }

  /**
   * Untransform a single resource object into raw data
   * @param  {Object} args
   * @param  {Object} args.resource - the json-api resource object
   * @param  {Object} args.data - an object where each key is the name of a data type and each value is an array of raw data objects
   * @param  Object[] args.resourceDataMap - an array of objects that map resources to a raw data objects
   * @param  {Object} args.document - the json-api resource document
   * @param  {Object} args.options - function level options
   * @param  {Array} args.resourceDataMap - an array where each entry is an object that contains the reousrce and the corresponding raw data object
   */
  function untransformResource({ resource, data, resourceDataMap, document, options }) {
    // get the appropriate data schema to use
    const dataSchema = getUntransformedDataSchema({ type: resource.type, resource, document, options })

    // untransform the resource id
    const id = getUntransformedId({ dataSchema, id: resource.id, type: resource.type, options })

    // untransform the resource attributes
    const attributes = getUntransformedAttributes({ dataSchema, id, type: resource.type, attributes: resource.attributes, resource, options })

    // create a plain javascript object with the resource id and attributes
    const obj = Object.assign({ id }, attributes)

    if (resource.relationships) {
      // for each relationship, add the relationship to the plain javascript object
      Object.keys(resource.relationships).forEach((relationshipName) => {
        const relationship = resource.relationships[relationshipName].data

        if (Array.isArray(relationship)) {
          obj[relationshipName] = relationship.map((relationshipResource) => {
            const relationshipDataSchema = getUntransformedDataSchema({ type: relationshipResource.type, resource: relationshipResource, document, options })

            return { id: getUntransformedId({ dataSchema: relationshipDataSchema, id: relationshipResource.id, type: relationshipResource.type, options }) }
          })
        } else {
          const relationshipDataSchema = getUntransformedDataSchema({ type: relationship.type, resource: relationship, document, options })

          obj[relationshipName] = { id: getUntransformedId({ dataSchema: relationshipDataSchema, id: relationship.id, type: relationship.type, options }) }
        }
      })
    }

    if (!data[resource.type]) {
      data[resource.type] = []
    }

    // add the plain javascript object to the untransformed output and map it to the resource
    data[resource.type].push(obj)
    resourceDataMap.push({ resource, object: obj })
  }

  /**
   * Get the data schema to use to untransform the resource object
   * @param  {Object} args
   * @param  {Object} args.type - the json-api resource object type
   * @param  {Object} args.resource - the json-api resource object
   * @param  {Object} args.document - the json-api resource document
   * @param  {Object} args.options - function level options
   */
  function getUntransformedDataSchema(args) {
    let dataSchema = getSchema({ name: args.type })

    // if the base schema defines a dataSchema function, use that to retrieve the
    // actual schema to use, otherwise return the base schema
    if (isFunction(dataSchema.schema.data.untransformDataSchema)) {
      const name = dataSchema.schema.data.untransformDataSchema(args)

      if (name !== dataSchema.name) {
        dataSchema = getSchema(name)

        if (!dataSchema) {
          throw new Error(`Missing Schema: ${name}`)
        }
      }
    }

    return dataSchema
  }

  /**
   * Untransform a resource object's id
   * @param  {Object} args
   * @param  {Object} args.dataSchema - the data schema for the resource object
   * @param  {Object} args.id - the json-api resource object id
   * @param  {Object} args.type - the json-api resource object type
   * @param  {Object} args.options - function level options
   */
  function getUntransformedId(args) {
    const { dataSchema, ...others } = args
    let id = others.id

    if (dataSchema.schema.data.untransformId) {
      id = dataSchema.schema.data.untransformId(others)
    }

    return id
  }

  /**
   * Untransform a resource object's attributes
   * @param  {Object} args
   * @param  {Object} args.dataSchema - the data schema for the resource object
   * @param  {Object} args.id - the json-api resource object id, determined in the data.untransformId step
   * @param  {Object} args.type - the json-api resource object type
   * @param  {Object} args.attributes - the json-api resource object attributes
   * @param  {Object} args.resource - the full json-api resource object
   * @param  {Object} args.options - function level options
   */
  function getUntransformedAttributes(args) {
    const { dataSchema, ...others } = args
    let attributes = others.attributes

    if (dataSchema.schema.data.untransformAttributes) {
      attributes = dataSchema.schema.data.untransformAttributes(others)
    }

    return attributes
  }

  /**
   * Nest related resources as defined by the json-api relationships
   * @param  {Object} args
   * @param  {Object} args.resourceDataMapping - An object that maps a resource to a raw data object
   * @param  {Object} args.data - An object where each key is the name of a data type and each value is an array of raw data objects
   */
  function nestRelatedResources({ resourceDataMapping, data }) {
    const resource = resourceDataMapping.resource
    const obj = resourceDataMapping.object

    if (resource.relationships) {
      // for each relationship, add the relationship to the plain javascript object
      Object.keys(resource.relationships).forEach((relationshipName) => {
        const relationship = resource.relationships[relationshipName].data

        if (Array.isArray(relationship)) {
          obj[relationshipName] = relationship.map((relationshipResource, index) => {
            const relationshipType = relationshipResource.type
            let relatedObj = { id: obj[relationshipName][index].id }

            if (data[relationshipType]) {
              const tempRelatedObj = data[relationshipType].find(d => d.id === obj[relationshipName][index].id)

              if (tempRelatedObj) {
                relatedObj = tempRelatedObj
              }
            }

            return relatedObj
          })
        } else {
          const relationshipType = relationship.type

          if (data[relationshipType]) {
            const relatedObj = data[relationshipType].find(d => d.id === obj[relationshipName].id)

            if (relatedObj) {
              obj[relationshipName] = relatedObj
            }
          }
        }
      })
    }
  }

  /**
   * Remove any circular references from a raw data object
   * @param  {Object} args
   * @param  {Object} args.object - the object to check for circular references
   * @param  {Object} args.processed - a WeakSet of data objects already checked for circular references
   * @param  {Object} args.visited - a WeakSet of data objects already visited in the object hierarchy
   */
  function removeCircularDependencies({ object, processed, visited }) {
    let queue = []

    processed.add(object)

    Object.keys(object).forEach((key) => {
      if (Array.isArray(object[key])) {
        object[key].forEach((item, index) => {
          if (isObject(item) && item.id) {
            if (visited.has(item)) {
              // if the property has already been visited (i.e. the current data object is a descendant of the property object)
              // replace it with a new object that only contains the id
              object[key][index] = { id: object[key][index].id }
            } else if (!processed.has(item)) {
              // if the property has not been processed,
              // add it to the queue to remove any circular references it contains
              queue = queue.concat(object[key])
            }
          }
        })
      } else if (isObject(object[key]) && object[key].id) {
        if (visited.has(object[key])) {
          // if the property has already been visited (i.e. the current data object is a descendant of the property object)
          // replace it with a new object that only contains the id
          object[key] = { id: object[key].id }
        } else if (!processed.has(object[key])) {
          // if the property has not been processed,
          // add it to the queue to remove any circular references it contains
          queue = queue.concat(object[key])
        }
      }
    })

    // add items to visited
    queue.forEach((item) => {
      visited.add(item)
    })

    // process the items
    queue.forEach((item) => {
      removeCircularDependencies({ object: item, processed, visited })
    })

    // remove items from visited
    queue.forEach((item) => {
      visited.delete(item)
    })
  }

  return {
    createInclude,
    getAttributes,
    getId,
    getRelationship,
    getRelationships,
    getSchema,
    getType,
    register,
    transform,
    transformData,
    transformRelationshipData,
    transformSource,
    untransform,
    untransformResource,
    getUntransformedDataSchema,
    getUntransformedId,
    getUntransformedAttributes,
    nestRelatedResources,
    removeCircularDependencies,
  }
}
