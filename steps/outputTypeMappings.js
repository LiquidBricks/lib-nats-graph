import { V } from './root/V.js'
import { addV } from './root/addV.js'
import { E } from './root/E.js'
import { addE } from './root/addE.js'
import { _vHasLabel } from './optimized/_vHasLabel.js'
import { dropEdge, dropGraph, dropVertex } from "./terminal/drop.js";
import { operationName, operationResultType } from './types.js'
import { edgeHas, vertexHas } from './filter/has.js'
import { edgeAnd, valueAnd, vertexAnd } from './filter/and.js'
import { edgeFilter, valueFilter, vertexFilter } from './filter/filter.js'
import { edgeLimit, valueLimit, vertexLimit } from './filter/limit.js'
import { edgeTail, valueTail, vertexTail } from './filter/tail.js'
import { edgeNot, valueNot, vertexNot } from './filter/not.js'
import { edgeOr, valueOr, vertexOr } from './filter/or.js'
import { edgeWhere, valueWhere, vertexWhere } from './filter/where.js'
import { edgePropertyStep, vertexPropertyStep } from './mutation/property.js'
import { bothE } from './shelved/bothE.js'
import { inStep } from './VtoV/in.js'
import { inE } from './VtoE/inE.js'
import { out } from './VtoV/out.js'
import { outE } from './VtoE/outE.js'
import { id } from './terminal/id.js'
import { edgeLabel, vertexLabel } from './terminal/label.js'
import { edgeProperties, vertexProperties } from './terminal/properties.js'
import { edgeValueMap, vertexValueMap } from './terminal/valueMap.js'
import { edgeBothV } from './shelved/edgeBothV.js'
import { edgeInV } from './EtoV/inV.js'
import { edgeOtherV } from './shelved/edgeOtherV.js'
import { edgeOutV } from './EtoV/outV.js'
import { count } from './terminal/count.js'
import { path } from './terminal/path.js'
import { vertexAs, edgeAs, valueAs } from './path/as.js'
import { select } from './path/select.js'




export const operationsMap = new Map([
  [operationName.V, V],
  [operationName.addV, addV],
  [operationName.E, E],
  [operationName.addE, addE],
  [operationName._vHasLabel, _vHasLabel],
  [operationName.property, vertexPropertyStep],
  [operationName.as, vertexAs],
  [operationName.has, vertexHas],
  [operationName.filter, vertexFilter],
  [operationName.and, vertexAnd],
  [operationName.or, vertexOr],
  [operationName.not, vertexNot],
  [operationName.out, out],
  [operationName.in, inStep],
  [operationName.outE, outE],
  [operationName.inE, inE],
  [operationName.bothE, bothE],
  [operationName.drop, dropVertex],
  [operationName.id, id],
  [operationName.label, vertexLabel],
  [operationName.properties, vertexProperties],
  [operationName.valueMap, vertexValueMap],
  [operationName.limit, vertexLimit],
  [operationName.tail, vertexTail],
  [operationName.path, path],
  [operationName.as, vertexAs],
  [operationName.where, vertexWhere],
  [operationName.property, edgePropertyStep],
  [operationName.outV, edgeOutV],
  [operationName.inV, edgeInV],
  [operationName.bothV, edgeBothV],
  [operationName.otherV, edgeOtherV],
  [operationName.drop, dropEdge],
  [operationName.label, edgeLabel],
  [operationName.properties, edgeProperties],
  [operationName.valueMap, edgeValueMap],
  [operationName.filter, edgeFilter],
  [operationName.and, edgeAnd],
  [operationName.or, edgeOr],
  [operationName.not, edgeNot],
  [operationName.tail, edgeTail],
  [operationName.path, path],
  [operationName.as, edgeAs],
  [operationName.where, edgeWhere],
  [operationName.and, valueAnd],
  [operationName.or, valueOr],
  [operationName.not, valueNot],
  [operationName.filter, valueFilter],
  [operationName.tail, valueTail],
  [operationName.path, path],
  [operationName.as, valueAs],
  [operationName.where, valueWhere],
  [operationName.select, select],
])


export const nextAvailableOperationsMap = new Map([
  [
    operationResultType.graph,
    new Map([
      ['V', V],
      ['addV', addV],
      ['E', E],
      ['addE', addE],
      ['drop', dropGraph],
      ['_vHasLabel', _vHasLabel]
    ]),
  ], [
    operationResultType.vertex,
    new Map([
      ['property', vertexPropertyStep],
      ['has', vertexHas],
      ['filter', vertexFilter],
      ['where', vertexWhere],
      ['and', vertexAnd],
      ['or', vertexOr],
      ['not', vertexNot],
      ['out', out],
      ['in', inStep],
      ['outE', outE],
      ['inE', inE],
      ['bothE', bothE],
      ['drop', dropVertex],
      ['id', id],
      ['label', vertexLabel],
      ['properties', vertexProperties],
      ['valueMap', vertexValueMap],
      ['limit', vertexLimit],
      ['tail', vertexTail],
      ['path', path],
      ['as', vertexAs],
      ['select', select],
      ['count', count],
    ]),
  ], [
    operationResultType.edge,
    new Map([
      ['property', edgePropertyStep],
      ['has', edgeHas],
      ['filter', edgeFilter],
      ['where', edgeWhere],
      ['and', edgeAnd],
      ['or', edgeOr],
      ['not', edgeNot],
      ['drop', dropEdge],
      ['label', edgeLabel],
      ['id', id],
      ['properties', edgeProperties],
      ['valueMap', edgeValueMap],
      ['outV', edgeOutV],
      ['inV', edgeInV],
      ['bothV', edgeBothV],
      ['otherV', edgeOtherV],
      ['limit', edgeLimit],
      ['tail', edgeTail],
      ['path', path],
      ['as', edgeAs],
      ['select', select],
      ['count', count],
    ]),
  ], [
    operationResultType.value,
    new Map([
      ['limit', valueLimit],
      ['tail', valueTail],
      ['count', count],
      ['filter', valueFilter],
      ['where', valueWhere],
      ['and', valueAnd],
      ['or', valueOr],
      ['not', valueNot],
      ['path', path],
      ['as', valueAs],
      ['select', select],
    ])
  ]
])
