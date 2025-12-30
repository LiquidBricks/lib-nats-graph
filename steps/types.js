
export const operationFactoryKey = Symbol('operationFactoryKey')
export const operationStreamWrapperKey = Symbol('operationStreamWrapperKey')
export const operationUsesTraverserKey = Symbol('operationUsesTraverserKey')
export const operationAppendsToPathKey = Symbol('operationAppendsToPathKey')


export const operationNameKey = Symbol('operationNameKey')
export const operationName = {
  'Graph': Symbol('operationName_Graph'),
  'V': Symbol('operationName_V'),
  'addV': Symbol('operationName_addV'),
  'E': Symbol('operationName_E'),
  'addE': Symbol('operationName_addE'),
  '_vHasLabel': Symbol('operationName__vHasLabel'),
  'property': Symbol('operationName_property'),
  'has': Symbol('operationName_has'),
  'and': Symbol('operationName_and'),
  'or': Symbol('operationName_or'),
  'not': Symbol('operationName_not'),
  'drop': Symbol('operationName_drop'),
  'id': Symbol('operationName_id'),
  'label': Symbol('operationName_label'),
  'properties': Symbol('operationName_properties'),
  'valueMap': Symbol('operationName_valueMap'),
  'limit': Symbol('operationName_limit'),
  'bothE': Symbol('operationName_bothE'),
  'bothV': Symbol('operationName_bothV'),
  'inV': Symbol('operationName_inV'),
  'otherV': Symbol('operationName_otherV'),
  'outV': Symbol('operationName_outV'),
  'in': Symbol('operationName_in'),
  'out': Symbol('operationName_out'),
  'outE': Symbol('operationName_outE'),
  'count': Symbol('operationName_count'),
  'filter': Symbol('operationName_filter'),
  'path': Symbol('operationName_path'),
  'tail': Symbol('operationName_tail'),
  'as': Symbol('operationName_as'),
  'select': Symbol('operationName_select'),
  'where': Symbol('operationName_where'),
}



export const operationResultTypeKey = Symbol('operationResultTypeKey')
export const operationResultType = {
  graph: Symbol('operationResult_graph'),
  vertex: Symbol('operationResult_vertex'),
  edge: Symbol('operationResult_edge'),
  value: Symbol('operationResult_value')
}

// Centralized error codes for diagnostics
export const Errors = {
  INVALID_OPERATION: 'INVALID_OPERATION',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  KVSTORE_MISSING: 'KVSTORE_MISSING',

  // limit()
  LIMIT_INVALID: 'LIMIT_INVALID',

  // has()
  HAS_INVALID_KEY: 'HAS_INVALID_KEY',
  HAS_INVALID_VALUE: 'HAS_INVALID_VALUE',

  // and()
  AND_INVALID_PREDICATE: 'AND_INVALID_PREDICATE',

  // or()
  OR_INVALID_PREDICATE: 'OR_INVALID_PREDICATE',

  // not()
  NOT_INVALID_PREDICATE: 'NOT_INVALID_PREDICATE',

  // filter()
  FILTER_INVALID_PREDICATE: 'FILTER_INVALID_PREDICATE',

  // tail()
  TAIL_INVALID: 'TAIL_INVALID',

  // property()
  PROPERTY_INVALID_KEY: 'PROPERTY_INVALID_KEY',
  PROPERTY_RESERVED_KEY: 'PROPERTY_RESERVED_KEY',
  PROPERTY_INVALID_VALUE: 'PROPERTY_INVALID_VALUE',

  // addE()
  EDGE_LABEL_REQUIRED: 'EDGE_LABEL_REQUIRED',
  EDGE_INCOMING_REQUIRED: 'EDGE_INCOMING_REQUIRED',
  EDGE_OUTGOING_REQUIRED: 'EDGE_OUTGOING_REQUIRED',
  EDGE_INCOMING_MISSING: 'EDGE_INCOMING_MISSING',
  EDGE_OUTGOING_MISSING: 'EDGE_OUTGOING_MISSING',

  // addV()
  VERTEX_LABEL_REQUIRED: 'VERTEX_LABEL_REQUIRED',
  asdfasdfasd: 'VERTEX_CREATE_FAILEDxyz',

  // as()
  AS_INVALID_LABEL: 'AS_INVALID_LABEL',

  // select()
  SELECT_INVALID_LABEL: 'SELECT_INVALID_LABEL',
  SELECT_LABEL_MISSING: 'SELECT_LABEL_MISSING',

  // where()
  WHERE_INVALID_PREDICATE: 'WHERE_INVALID_PREDICATE',
}
