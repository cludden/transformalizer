# transformalizer
a bare bones node module for building JSON API v1.0 compliant payloads.

*Note: not ready for production use*



## Installing
```shell
$ npm install --save transformalizer
```



## Getting Started
**TODO**



## API

### createTransformalizer(options) => transformalizer
Create a new transformalizer object

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| [options] | Object | global options shared between all schemas |

### transformalizer.register({ type, schema })

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| type* | String | json api type |
| schema* | Object | mappings for type |

### transformalizer.transform({ type, source, options }) => Object



## Schema
A schema object defines a set of functions used to transform your raw data into a valid JSON API document.

### type({ source, options, data }) => String
A function that should return the type of the resource being processed. If this returns a type other than the schema type, the other schema will be used in place of the current schema.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| data | Object | the current item being processed when source is an array, or the source itself if not an array |

---

### id({ source, options, data }) => String
A function that should return the id of the resource being processed.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| data | Object | the current item being processed when source is an array, or the source itself if not an array |

---

### attributes({ source, options, data, id }) => Object
A function that should return the attributes portion of the resource being processed. If a null or undefined value is returned, no attributes will be included on the resource.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| data | Object | the current item being processed when source is an array, or the source itself if not an array |
| id | String | the id of the current resource |

---

### relationships.[key]({ source, options, data, id, attributes, include }) => Object
A map of relationship keys to functions that should return a valid [relationship object](http://jsonapi.org/format/#document-resource-object-relationships). If a null or undefined value is returned, that relationship will be excluded from the resulting object.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| data | Object | the current item being processed when source is an array, or the source itself if not an array |
| id | String | the id of the current resource |
| attributes | Object | the attributes object for the resource being processed |
| include | Function | TODO

---

### links({ source, options, data, id, attributes, relationships }) => Object
A function that should return the links portion of the resource being processed. If a null or undefined value is returned, no attributes will be included on the resource.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| data | Object | the current item being processed when source is an array, or the source itself if not an array |
| id | String | the id of the current resource |
| attributes | Object | the attributes object for the resource being processed |
| relationships | Object | the relationships object for the resource being processed |

---

### meta({ source, options, data, id, attributes, relationships, links }) => Object
A function that should return the meta portion of the resource being processed. If a null or undefined value is returned, no attributes will be included on the resource.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| data | Object | the current item being processed when source is an array, or the source itself if not an array |
| id | String | the id of the current resource |
| attributes | Object | the attributes object for the resource being processed |
| relationships | Object | the relationships object for the resource being processed |
| links | Object | the links object of the resource being processed |

---

### topLevelLinks({ source, options, document }) => Object
A function that should return the top level links for the current document.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| document | Object | the current json api document |

---

### topLevelMeta({ source, options, document }) => Object
A function that should return the top level meta for the current document.

###### Parameters
| Name | Type | Description |
| --- | --- | --- |
| source | Object[],Object | the source data passed to the #transform function |
| options | Object | any options passed to the #transform function |
| document | Object | the current json api document |



## Test
```shell
$ npm test
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
