import React, { useState, useEffect } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useSubstrate } from '../SubstrateContext';
import { useAccount } from '../AccountContext';
import { useAccountBalance } from '../AccountBalance';

const Staking = () => {
  const { api } = useSubstrate();
  const { selectedAccount } = useAccount();
  const { formattedBalanceName, formattedBalance } = useAccountBalance();
  const [stakingLedger, setStakingLedger] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    const fetchStakingLedger = async () => {
      try {
        if (api) {
          const { address } = selectedAccount;

          // Subscribe to staking ledger
          const unsubscribe = await api.query.staking.ledger(
            address,
            (result) => {
              if (result.isSome) {
                setStakingLedger(result.unwrap());
              }
            }
          );

          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error fetching ledger information:', error);
      }
    };

    const fetchSessionInfo = async () => {
      try {
        if (api) {
          // Subscribe to current era
          const unsubscribe = await api.derive.session.progress((result) => {
            setSessionInfo(result);
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error fetching ledger information:', error);
      }
    };

    fetchStakingLedger();
    fetchSessionInfo();
  }, [api, selectedAccount]);

  const totalUnlocking = () => {
    return stakingLedger?.unlocking.reduce((sum, u) => sum + u.value, 0);
  };

  // Calculates the unlocking date given an unlock era
  const unlockingDate = (era) => {
    if (sessionInfo) {
      let activeEra = sessionInfo.activeEra.toNumber();
      let erasLeft = Math.max(era - activeEra, 0);
      let eraLength = sessionInfo.eraLength.toNumber();
      let blocksLeft = erasLeft * eraLength;
      let startDate = new Date(sessionInfo.activeEraStart / 1);
      let secondsLeft = blocksLeft * 6;
      let unlockDate = new Date(startDate.getTime() + secondsLeft * 1000);
      return unlockDate.toLocaleString();
    } else {
      return 'Calculating unlock date...';
    }
  };

  return (
    <>
      {stakingLedger ? (
        <div>
          <h2>Pallet Staking</h2>
          <ProgressBar>
            <ProgressBar
              striped
              variant="success"
              now={1200000000}
              max={stakingLedger.total}
              label={formattedBalance(12)}
              key={1}
            />
            <ProgressBar
              variant="warning"
              now={totalUnlocking()}
              max={stakingLedger.total}
              label={formattedBalance(totalUnlocking())}
              key={2}
            />
            <ProgressBar
              variant="danger"
              now={stakingLedger.active}
              max={stakingLedger.total}
              label={formattedBalance(stakingLedger.active)}
              key={2}
            />
          </ProgressBar>
          <p>
            You have a total staking balance of{' '}
            {formattedBalanceName(stakingLedger.total)}.
            <br />
            You have a total of {formattedBalanceName(totalUnlocking())}{' '}
            unlocking.
            <ul>
              {stakingLedger.unlocking.map((u) => {
                return (
                  <li>
                    {formattedBalanceName(u.value)} at approximately{' '}
                    {unlockingDate(u.era)}
                  </li>
                );
              })}
            </ul>
          </p>
          <details>
            <summary>Raw Staking Data</summary>
            <div>{JSON.stringify(stakingLedger, null, 2)}</div>
            <div>{JSON.stringify(sessionInfo, null, 2)}</div>
          </details>
        </div>
      ) : (
        'no balance found'
      )}
    </>
  );
};

export default Staking;
