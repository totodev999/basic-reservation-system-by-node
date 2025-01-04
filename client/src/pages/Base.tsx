import React, { createContext } from 'react';
import { Outlet } from 'react-router';

type StateType = {
  reservationType: number | undefined;
  selectedStore: number | undefined;
};

type ContextType = {
  state: StateType;
  setState: ({
    stateString,
    state,
  }: {
    stateString: 'reservationType' | 'selectedStore';
    state: number;
  }) => void;
};
export const Context = createContext<ContextType | undefined>(undefined);

const Base = () => {
  const [state, setState] = React.useState<StateType>({
    reservationType: undefined,
    selectedStore: undefined,
  });

  const setStateWrapper = ({
    stateString,
    state,
  }: {
    stateString: 'reservationType' | 'selectedStore';
    state: number;
  }) => {
    if (stateString === 'reservationType') {
      setState((prev) => ({
        ...prev,
        reservationType: state,
      }));
    }
    if (stateString === 'selectedStore') {
      setState((prev) => ({
        ...prev,
        selectedStore: state,
      }));
    }
  };

  return (
    <Context.Provider value={{ state, setState: setStateWrapper }}>
      <Outlet />
    </Context.Provider>
  );
};

export default Base;
