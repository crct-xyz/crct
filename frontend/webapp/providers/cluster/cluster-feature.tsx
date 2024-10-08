'use client'

import { useState } from 'react'
// import { AppHero } from 'components/ui/ui-layout'
import { ClusterUiModal } from './cluster-ui'
import { ClusterUiTable } from './cluster-ui'

export default function ClusterFeature() {
    const [showModal, setShowModal] = useState(false)

    return (
        <div>
            hello
            <ClusterUiTable />
        </div>
    )
}
