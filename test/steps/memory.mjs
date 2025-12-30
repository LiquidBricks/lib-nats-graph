import { makeSetup } from '../helpers/providers.mjs'
import { kvProvider as memoryProvider } from '../../kvProvider/memory/provider.js'
import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'

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

const setup = makeSetup('memory')
const diagnostics = () => createDiagnostics()

const kvProviderFactory = () => memoryProvider({ ctx: { diagnostics: diagnostics() } })

runGraphSuite({ label: 'memory', setup })
runVSuite({ label: 'memory', setup })
runAddVSuite({ label: 'memory', setup })
runAddESuite({ label: 'memory', setup })
runCountSuite({ label: 'memory', setup })
runDropSuite({ label: 'memory', setup })
runESuite({ label: 'memory', setup })
runHasSuite({ label: 'memory', setup })
runIdSuite({ label: 'memory', setup })
runAndSuite({ label: 'memory', setup })
runOrSuite({ label: 'memory', setup })
runNotSuite({ label: 'memory', setup })
runFilterSuite({ label: 'memory', setup })
runInSuite({ label: 'memory', setup })
runInESuite({ label: 'memory', setup })
runInVSuite({ label: 'memory', setup })
runLabelSuite({ label: 'memory', setup })
runLimitSuite({ label: 'memory', setup })
runOutSuite({ label: 'memory', setup })
runOutESuite({ label: 'memory', setup })
runOutVSuite({ label: 'memory', setup })
// runPropertiesSuite({ label: 'memory', setup })
runPropertySuite({ label: 'memory', setup })
runValueMapSuite({ label: 'memory', setup })
runVHasLabelSuite({ label: 'memory', kvProviderFactory, diagnosticsFactory: diagnostics })
runPathSuite({ label: 'memory', setup })
runTailSuite({ label: 'memory', setup })
runAsSuite({ label: 'memory', setup })
runSelectSuite({ label: 'memory', setup })
runWhereSuite({ label: 'memory', setup })
