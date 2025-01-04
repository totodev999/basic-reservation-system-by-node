import { Suspense, use, useContext, useEffect } from 'react';
import { Context } from '../Base';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { ErrorBoundary } from 'react-error-boundary';

const Store = () => {
  const { state } = useContext(Context)!;
  const navigate = useNavigate();

  useEffect(
    () => {
      if (!state.reservationType) {
        navigate('/type');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div>
      <div className="grid place-content-center min-h-screen min-w-max">
        <h2 className="text-center text-3xl">Select Store</h2>
        <div className="mt-10">
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <Suspense fallback={<div className="text-center">Loading...</div>}>
              <ShowStores />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

const getStores = async () => {
  const res = await axios.get<
    {
      id: number;
      storeName: string;
      address: string;
      phoneNumber: string;
    }[]
  >('/api/stores');
  return res.data;
};

// use hook cannot invoke function, so you have to invoke function before use
const invokeGetStores = getStores();

export const ShowStores = () => {
  const stores = use(invokeGetStores);
  const navigate = useNavigate();

  const { setState } = useContext(Context)!;
  const handleClick = (id: number) => {
    setState({ stateString: 'selectedStore', state: id });
    navigate('/reservation');
  };

  return (
    <div className="flex flex-col gap-2 justify-center w-screen">
      {stores.map((store) => {
        return (
          <div className="mx-auto text-center" key={store.id}>
            <button
              className="bg-teal-300 block w-[300px] p-3 border-amber-100 border-4 duration-200 hover:scale-110 hover:border-dashed focus:scale-110 focus:border-dashed focus:outline-none"
              onClick={() => handleClick(store.id)}
            >
              <div className="font-bold">{store.storeName}</div>
              <div>
                Address:<address>{store.address}</address>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Store;
