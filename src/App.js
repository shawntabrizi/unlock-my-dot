import { SubstrateProvider } from './SubstrateContext';
import { AccountProvider } from './AccountContext';
import { AccountBalance, AccountBalanceProvider } from './AccountBalance';
import BlockNumber from './BlockNumber';
import { Container } from 'react-bootstrap';
import Vesting from './pallets/Vesting';
import Staking from './pallets/Staking';

function App() {
  return (
    <Container>
      <div className="bg-light rounded p-4 mb-4 mt-4">
        <h1>Unlock My DOT</h1>
      </div>
      {/* In this example, we use a single account context for two different blockchains. */}
      <AccountProvider
        appName="unlock-my-dot"
        forceAccounts={['5DksjtJER6oLDWkWKCWcL3f1swPWeNNFsS9zHxa2rPa7LsH9']}
      >
        <SubstrateProvider providerUrl="wss://rpc.polkadot.io">
          <h2>Polkadot</h2>
          <BlockNumber />
          {/* Pallets */}
          <AccountBalanceProvider>
            <AccountBalance />
            <Vesting />
            <Staking />
          </AccountBalanceProvider>
        </SubstrateProvider>
      </AccountProvider>
    </Container>
  );
}

export default App;
