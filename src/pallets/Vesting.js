import React, { useState } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useSubstrate } from '../SubstrateContext';
import { useAccount } from '../AccountContext';
import { useAccountBalance } from '../AccountBalance';
import { Button } from 'react-bootstrap';
import { web3FromAddress } from '@polkadot/extension-dapp';

const Vesting = () => {
  const { api } = useSubstrate();
  const { selectedAccount } = useAccount();
  const { balances, formattedBalance, formattedBalanceName } =
    useAccountBalance();
  const [status, setStatus] = useState('');

  const claimVested = async () => {
    try {
      if (api && selectedAccount) {
        const { address } = selectedAccount;

        // Use the injected account for signing
        const injector = await web3FromAddress(address);

        const unsubscribe = await api.tx.vesting
          .vest()
          .signAndSend(address, { signer: injector.signer }, ({ status }) => {
            setStatus(`Current status is ${status}`);

            if (status.isInBlock) {
              setStatus(
                `Transaction included at blockHash ${status.asInBlock}`
              );
            } else if (status.isFinalized) {
              setStatus(
                `Transaction finalized at blockHash ${status.asFinalized}`
              );
              unsubscribe();
            }
          });
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const amountClaimed = balances?.vestedBalance - balances?.vestedClaimable;
  const amountClaimable = balances?.vestedClaimable;
  const amountVesting = balances?.vestingTotal - balances?.vestedBalance;

  return (
    <>
      {balances ? (
        <div>
          <h2>Pallet Vesting</h2>
          <ProgressBar>
            <ProgressBar
              striped
              variant="success"
              now={amountClaimed}
              max={balances.vestingTotal}
              label={formattedBalance(amountClaimed)}
              key={1}
            />
            <ProgressBar
              variant="warning"
              now={amountClaimable}
              max={balances.vestingTotal}
              label={formattedBalance(amountClaimable)}
              key={2}
            />
            <ProgressBar
              variant="danger"
              now={amountVesting}
              max={balances.vestingTotal}
              label={formattedBalance(amountVesting)}
              key={3}
            />
          </ProgressBar>
          <p>
            You have a total vesting balance of{' '}
            {formattedBalanceName(balances.vestingTotal)}.
            <br />
            You have already claimed {formattedBalanceName(amountClaimed)}.
            <br />
            You can unlock {formattedBalanceName(amountClaimable)} right now.
            <br />
            You need to wait to unlock {formattedBalanceName(amountVesting)}.
          </p>
          <div>
            <Button onClick={claimVested}>
              Unlock {formattedBalanceName(amountClaimable)}
            </Button>
            {status}
          </div>
          <details>
            <summary>Raw Vesting Data</summary>
            <ul>
              <li>
                Vested Balance: {formattedBalanceName(balances.vestedBalance)}
              </li>
              <li>
                Vesting Locked: {formattedBalanceName(balances.vestingLocked)}
              </li>
              <li>
                Vested Claimable:{' '}
                {formattedBalanceName(balances.vestedClaimable)}
              </li>
              <li>
                Vesting Total: {formattedBalanceName(balances.vestingTotal)}
              </li>
              <li>
                Vesting Breakdown: {JSON.stringify(balances.vesting, null, 2)}
              </li>
            </ul>
          </details>
        </div>
      ) : (
        'no balance found'
      )}
    </>
  );
};

export default Vesting;
