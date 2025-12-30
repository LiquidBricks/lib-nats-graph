import { makeSetup } from '../helpers/providers.mjs'
import { kvProvider as natsProvider } from '../../kvProvider/nats/provider.js'
import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'
import { NATS_IP_ADDRESS } from '../util/config.js'
import { ulid } from 'ulid'
import assert from 'node:assert/strict'

import { runAddESuite } from './addE.shared.mjs'
import { runAddVSuite } from './addV.shared.mjs'
import { runVSuite } from './V.shared.mjs'
import { runCountSuite } from './count.shared.mjs'
import { runDropSuite } from './drop.shared.mjs'
import { runESuite } from './E.shared.mjs'
import { runGraphSuite } from './Graph.shared.mjs'
import { runHasSuite } from './has.shared.mjs'
import { runIdSuite } from './id.shared.mjs'
import { runAndSuite } from './and.shared.mjs'
import { runOrSuite } from './or.shared.mjs'
import { runNotSuite } from './not.shared.mjs'
import { runFilterSuite } from './filter.shared.mjs'
import { runInSuite } from './in.shared.mjs'
import { runInESuite } from './inE.shared.mjs'
import { runInVSuite } from './inV.shared.mjs'
import { runLabelSuite } from './label.shared.mjs'
import { runLimitSuite } from './limit.shared.mjs'
import { runOutSuite } from './out.shared.mjs'
import { runOutESuite } from './outE.shared.mjs'
import { runOutVSuite } from './outV.shared.mjs'
import { runPropertiesSuite } from './properties.shared.mjs'
import { runPropertySuite } from './property.shared.mjs'
import { runValueMapSuite } from './valueMap.shared.mjs'
import { runVHasLabelSuite } from './_vHasLabel.shared.mjs'
import { runPathSuite } from './path.shared.mjs'
import { runTailSuite } from './tail.shared.mjs'
import { runAsSuite } from './as.shared.mjs'
import { runSelectSuite } from './select.shared.mjs'
import { runWhereSuite } from './where.shared.mjs'

assert.ok(NATS_IP_ADDRESS, 'NATS_IP_ADDRESS missing; set in test/.env')

const setup = makeSetup('nats')
const diagnostics = () => createDiagnostics()

const kvProviderFactory = () => natsProvider({
  config: { servers: NATS_IP_ADDRESS, bucket: `testing-${ulid()}` },
  ctx: { diagnostics: diagnostics() }
})

runGraphSuite({ label: 'nats', setup })
runVSuite({ label: 'nats', setup })
runAddVSuite({ label: 'nats', setup })
runAddESuite({ label: 'nats', setup })
runCountSuite({ label: 'nats', setup })
runDropSuite({ label: 'nats', setup })
runESuite({ label: 'nats', setup })
runHasSuite({ label: 'nats', setup })
runIdSuite({ label: 'nats', setup })
runAndSuite({ label: 'nats', setup })
runOrSuite({ label: 'nats', setup })
runNotSuite({ label: 'nats', setup })
runFilterSuite({ label: 'nats', setup })
runInSuite({ label: 'nats', setup })
runInESuite({ label: 'nats', setup })
runInVSuite({ label: 'nats', setup })
runLabelSuite({ label: 'nats', setup })
runLimitSuite({ label: 'nats', setup })
runOutSuite({ label: 'nats', setup })
runOutESuite({ label: 'nats', setup })
runOutVSuite({ label: 'nats', setup })
// runPropertiesSuite({ label: 'nats', setup })
runPropertySuite({ label: 'nats', setup })
runValueMapSuite({ label: 'nats', setup })
runVHasLabelSuite({ label: 'nats', kvProviderFactory, diagnosticsFactory: diagnostics })
runPathSuite({ label: 'nats', setup })
runTailSuite({ label: 'nats', setup })
runAsSuite({ label: 'nats', setup })
runSelectSuite({ label: 'nats', setup })
runWhereSuite({ label: 'nats', setup })
