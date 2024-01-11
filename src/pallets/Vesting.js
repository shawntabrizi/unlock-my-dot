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
  const { balances, formattedBalance, tokenInfo } = useAccountBalance();
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
              key={2}
            />
          </ProgressBar>
          <p>
            You have a total vesting balance of{' '}
            {formattedBalance(balances.vestingTotal)} {tokenInfo.name}.
            <br />
            You have already claimed {formattedBalance(amountClaimed)}{' '}
            {tokenInfo.name}.
            <br />
            You can unlock {formattedBalance(amountClaimable)} {tokenInfo.name}{' '}
            right now.
            <br />
            You need to wait to unlock {formattedBalance(amountVesting)}{' '}
            {tokenInfo.name}.
          </p>
          <div>
            <Button onClick={claimVested}>
              Unlock {formattedBalance(amountClaimable)} {tokenInfo.name}
            </Button>
            {status}
          </div>
          <details>
            <summary>Raw Vesting Data</summary>
            <ul>
              <li>
                Vested Balance: {formattedBalance(balances.vestedBalance)}{' '}
                {tokenInfo.name}
              </li>
              <li>
                Vesting Locked: {formattedBalance(balances.vestingLocked)}{' '}
                {tokenInfo.name}
              </li>
              <li>
                Vested Claimable: {formattedBalance(balances.vestedClaimable)}{' '}
                {tokenInfo.name}
              </li>
              <li>
                Vesting Total: {formattedBalance(balances.vestingTotal)}{' '}
                {tokenInfo.name}
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
