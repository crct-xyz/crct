import { ReactQueryProvider } from './react-query-provider'
import { ClusterProvider } from './cluster/cluster-data-access'
import { SolanaProvider } from './solana-provider/solana-provider'
import { UserProvider } from './context-provider/context-provider'

const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <UserProvider>
            <ReactQueryProvider>
                <ClusterProvider>
                    <SolanaProvider>{children}</SolanaProvider>
                </ClusterProvider>
            </ReactQueryProvider>
        </UserProvider>
    )
}

export default GlobalProvider
